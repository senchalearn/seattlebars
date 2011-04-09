sb = new Ext.Application({

    launch: function() {
        this.viewport = new this.Viewport();
    },


    Viewport: Ext.extend(Ext.Panel, {

        id        : 'viewport',
        layout    : 'card',
        fullscreen: true,

        dockedItems: [{
            dock : 'top',
            xtype: 'toolbar',
            title: 'City ' + BUSINESS_TYPE
        }],

        items: [
            {
                id: 'loading',
                setStatus: function(text) {
                    this.el.mask(Ext.LoadingSpinner + text, 'x-mask-loading');
                }
            }, {
                id: 'list',
                xtype: 'list',
                store: null,
                itemTpl: '<tpl for="."><strong>{name}</strong></tpl>'
            }, {
                id: 'detail',
                xtype: 'list',
                store: null,
                itemTpl: '<tpl for="."><strong>{name}</strong></tpl>'
            }
        ],

        cardSwitchAnimation: 'slide',

        listeners: {
            'afterrender': function () {
                var viewport = this;
                var list = viewport.getComponent('list');
                var loading = viewport.getComponent('loading');


                // do the geolocation locally
                loading.setStatus("Getting location");
                sb.getLocation(function (geo) {

                    // then use MongoLabs to get the nearest city
                    loading.setStatus("Getting city");
                    sb.getCity(geo, function (city) {
                        viewport.getDockedItems()[0].setTitle(city + ' ' + BUSINESS_TYPE);

                        // then use Yelp to get the businesses
                        loading.setStatus("Getting data");
                        sb.getBusinesses(city, function (store) {

                            // then bind data and show it
                            list.bindStore(store);
                            viewport.setActiveItem(list);

                        });

                    });
                });
            }

        }

    }),


    getLocation: function (callback) {
        new Ext.util.GeoLocation({
            autoUpdate: false,
            listeners: {
                locationupdate: callback
            }
        }).updateLocation();
    },

    getCity: function (geo, callback) {

        // create data model for city
        Ext.regModel("City", {
            fields: [
                {name: "name", type: "string"}
            ]
        });

        Ext.Ajax.useDefaultXhrHeader = false; // mongolab cors
        Ext.regStore("cities", {
            model: 'City',
            autoLoad: true,
            proxy: {

                //the Mongo way:
                type: 'ajax',
                url: 'https://mongolab.com/api/1/databases/cities/collections/cities?q=' +
                    escape(
                        '{"location":{"$near":{' +
                            '"lat":' + geo.latitude + ',' +
                            '"long":' + geo.longitude +
                        '}}}'
                    ) +
                    '&l=1' +
                    '&apiKey=' + MONGOLAB_KEY
                ,

                //the local way:
                //type: 'memory',
                //data: [{"name":DEFAULT_CITY}],
                //

                reader: {
                    type: 'json'
                }
            },
            listeners: {
                'load': function (store, records, success) {
                    callback(records[0].get('name'))
                }
            }

        });

    },


    getBusinesses: function (city, callback) {
        // create data model
        Ext.regModel("Business", {
            fields: [
                {name: "id", type: "int"},
                {name: "name", type: "string"}
            ]
        });

        Ext.regStore("businesses", {
            model: 'Business',
            autoLoad: true,
            proxy: {
                type: 'scripttag',
                url: 'http://api.yelp.com/business_review_search' +
                    '?ywsid=' + YELP_KEY+
                    '&term=' + escape(BUSINESS_TYPE) +
                    '&location=' + escape(city)
                ,
                reader: {
                    type: 'json',
                    root: 'businesses'
                }
            },
            listeners: {
                'load': function (store) {
                    callback(store);
                }
            }
        })
    }

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
