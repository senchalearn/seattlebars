seattlebars = new Ext.Application({

    launch: function() {
        this.viewport = new this.Viewport({
            application: this,
            city: CITY,
            business_type: BUSINESS_TYPE,
            yelp_key: YELP_KEY
        });
    },

    Viewport: Ext.extend(Ext.Panel, {

        id        : 'viewport',
        layout    : 'card',
        fullscreen: true,

        dockedItems: [{
            dock : 'top',
            xtype: 'toolbar',
            title: 'City Businesses'
        }],


        initComponent: function () {
            seattlebars.Viewport.superclass.initComponent.call(this);

            // create data model
            Ext.regModel("Business", {
                fields: [
                    {name: "id", type: "int"},
                    {name: "name", type: "string"}
                ]
            });

            // create main list
            this.add(new Ext.List({

                store: new Ext.data.Store({
                    model: 'Business',
                    autoLoad: true,
                    proxy: {
                        type: 'scripttag',
                        url: 'http://api.yelp.com/business_review_search' +
                            '?ywsid=' + this.yelp_key +
                            '&term=' + escape(this.business_type) +
                            '&location=' + escape(this.city)
                        ,
                        reader: {
                            type: 'json',
                            root: 'businesses'
                        }
                    }
                }),

                itemTpl: '<tpl for="."><strong>{name}</strong></tpl>'
            }));

            this.getDockedItems()[0].setTitle(this.city + ' ' + this.business_type);

        }

    })

});

    //listeners: {
    //    selectionchange: function(selectionModel, records) {
    //        if (records.length>0) {
    //            Ext.dispatch({
    //                controller:'businesses',
    //                action:'detail',
    //                id: records[0].getId(),
    //                historyUrl: 'businesses/detail/' + records[0].getId()
    //            });
    //        }
    //    }
    //}
    //
    //
    //
    //                           ))
