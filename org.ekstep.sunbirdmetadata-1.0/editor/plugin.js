/**
 * @description
 * @extends org.ekstep.collectioneditor.basePlugin
 * @since 1.0
 * @author Kartheek Palla And Manjunath Davanam
 */

org.ekstep.collectioneditor.metadataPlugin.extend({
    /**
     * @property    - Form object which contains field details with framework and resource bundle
     */
    form: {},

    /**  
     * @property    - Resource Bundle object.
     */
    resourceBundle: {},

    /**
     * @property     - Framwork association object which is used to map the relationship between fields. eg:(Grade, class)
     */
    framework: {},

    /**
     * @property     - Form configuration object
     */
    config: {},

    /**
     * @property      - List of are event are mapped with the action
     */
    actionMap: { save: "org.ekstep.contenteditor:save", review: "org.ekstep.contenteditor:review" },

    /**
     * @description    - Initialization of the plugin.
     */
    initialize: function() {
        var instance = this;
        ecEditor.addEventListener('editor:form:cancel', this.cancelAction, this);
        ecEditor.addEventListener('editor:form:success', this.successAction, this);
        ecEditor.addEventListener('editor:form:change', this.onConfigChange, this);
        ecEditor.addEventListener('editor:form:reset', this.resetFields, this);
        ecEditor.addEventListener('org.ekstep.editcontentmeta:showpopup', this.showForm, this);
        this.getConfigurations(function(error, res) {
            res ? instance.renderForm({ resourceBundle: res.resourceBundle, framework: res.framework.data.result.framework, formConfig: res.config }) : console.error('Fails to render')
        });
    },

    /**
     * @description         - When field value changes. Currenlty, Event is dispatching
     *                        only when drop down value changes
     */
    onConfigChange: function(event, object) {},

    /**
     * @event           -'editor:form:success'
     *                  
     * @description     - Which is used to perform the save/review actions when form is submitted.
     *                    Which is currently handles 'review` and `save' action
     */
    successAction: function(event, data) {
        if (data.isValid) {
            let actionEvent = this.actionMap[this.config.action];
            this.updateState(data.formData);
            ecEditor.dispatchEvent(actionEvent, {
                savingPopup: true,
                successPopup: true,
                failPopup: true,
                contentMeta: data.formData,
                showNotification: true,
                callback: function(err, res) {
                    if (res && res.data && res.data.responseCode == "OK") {
                        data.callback && data.callback(undefined, res);
                    } else {
                        data.callback && data.callback(err, undefined);
                    }
                }
            })
        } else {
            throw 'Invalid form data'
        }
    },

    /**
     * @description              - When cancel action is invoked
     * @event                    - 'editor:form:cancel'
     * @param {Object} data      - Which contains a callback method and other options 
     */
    cancelAction: function(event, data) {
        data.callback && data.callback()
    },

    /**
     * @description             - Which get the form configurations, framework and resource bundle data
     *                            Which makes async parallel call.
     */
    getConfigurations: function(callback) {
        var instance = this;
        async.parallel({
            config: function(callback) {
                // get the formConfigurations data
                callback(undefined, {})
            },
            framework: function(callback) {
                // get the framworkData
                var frameworkId = ecEditor.getContext('framework') || org.ekstep.services.collectionService.defaultFramwork;
                ecEditor.getService(ServiceConstants.META_SERVICE).getCategorys(frameworkId, function(error, response) {
                    if (!error) callback(undefined, response)
                    else throw 'Unable to fetch the framework data.'
                })
            },
            resourceBundle: function(callback) {
                // get the resource bundle data 
                callback(undefined, {})
            }
        }, function(error, response) {
            // results is now equals to: {config: {}, framework: {}, resourceBundle:{}}
            callback(err, response);
        });
    },

    /**
     * @description             - Which returns the current form object.
     * @returns {Object}    
     */
    getFormFields: function() {
        return this.form;
    },

    /**
     * @description             - Which is used to render the form with the configurations.
     * @param {Object} formObj  - Form object it should have configurations, resourceBundle, framework object
     * @example                 - {resourceBundle:{},framework:{},config:{}}
     */
    renderForm: function({ resourceBundle, framework, formConfig } = {}) {
        this.resourceBundle = resourceBundle;
        this.framework = framework;
        this.config = formConfig;
        this.config = window.formConfigurations; // Remove this line
        this.form = this.mapObject(this.config.fields, this.framework.categories);
        this.loadTemplate(this.config.templateName);
    },


    /**
     * @description             - Which is used to set the state of form object.
     * @param {Object} stateObj - It should contain the {isRoot, isNew, and form metaData information}
     */
    updateState: function({ nodeId, isRoot, isNew, metaData } = {}) {
        let key = nodeId;
        let value = {};
        value.root = isRoot;
        value.isNew = isNew;
        value.metadata = metaData;
        org.ekstep.services.stateService.setState(key, value);
    }

});
//# sourceURL=sunbirdmetadataplugin.js;