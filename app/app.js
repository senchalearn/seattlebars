sb = new Ext.Application({

    launch: function() {
        this.viewport = new this.Viewport();
    },


    Viewport: Ext.extend(Ext.Panel, {

        id        : 'viewport',
        layout    : 'card',
        fullscreen: true,

        items: [
            {
                id: 'loading',
                setStatus: function(text) {
                    this.el.mask(Ext.LoadingSpinner + text, 'x-mask-loading');
                }
            }, {
                id: 'list',
                xtype: 'panel',
                dockedItems: [{
                    dock : 'top',
                    xtype: 'toolbar',
                    title: ''
                }],
                items: {
                    id: 'datalist',
                    xtype: 'list',
                    store: null,
                    itemTpl: '<tpl for="."><strong>{name}</strong></tpl>',
                    listeners: {
                        selectionchange: function (selectionModel, records) {
                            if (records[0]) {
                                sb.viewport.setActiveItem(sb.viewport.detail);
                                sb.viewport.detail.update(records[0].data);
                            }
                        }
                    }
                }
            }, {
                id: 'detail',
                xtype: 'tabpanel',
                dockedItems: [{
                    dock : 'top',
                    xtype: 'toolbar',
                    title: '',
                    items: [{
                        text: 'Back',
                        ui: 'back',
                        listeners: {
                            tap: function () {
                                sb.viewport.setActiveItem(
                                    sb.viewport.list,
                                    {type:'slide', direction: 'right'}
                                );
                            }
                        }
                    }]
                }],
                tabBar: {
                    dock: 'top',
                    ui: 'light',
                    layout: { pack: 'center' }
                },
                items: [
                    {
                        title: 'Contact',
                        tpl: '{address1}'
                    },
                    {
                        title: 'Map',
                        xtype: 'map',
                        update: function (data) {
                            this.map.setCenter(new google.maps.LatLng(data.latitude, data.longitude));
                            this.marker.setPosition(
                                this.map.getCenter()
                            );
                            this.marker.setMap(this.map);
                        },
                        marker: new google.maps.Marker()
                    }
                ],
                update: function(data) {
                    Ext.each(this.items.items, function(item) {
                        item.update(data);
                    });
                    this.getDockedItems()[0].setTitle(data.name);
                }
            }
        ],

        cardSwitchAnimation: 'slide',

        listeners: {
            'afterrender': function () {

                //some useful references
                this.list = this.getComponent('list');
                this.detail = this.getComponent('detail');
                var loading = this.getComponent('loading'),
                    datalist = this.list.getComponent('datalist');
                    viewport = this;

                // do the geolocation locally
                loading.setStatus("Getting location");
                sb.getLocation(function (geo) {

                    // then use MongoLabs to get the nearest city
                    loading.setStatus("Getting city");
                    sb.getCity(geo, function (city) {
                        sb.viewport.list.getDockedItems()[0].setTitle(city + ' ' + BUSINESS_TYPE);

                        // then use Yelp to get the businesses
                        loading.setStatus("Getting data");
                        sb.getBusinesses(city, function (store) {

                            // then bind data and show it
                            datalist.bindStore(store);
                            viewport.setActiveItem(sb.viewport.list);

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

                //the MongoLabs way:
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
                {name: "name", type: "string"},
                {name: "latitude", type: "string"},
                {name: "longitude", type: "string"},
                {name: "address1", type: "string"},
                {name: "address2", type: "string"},
                {name: "address3", type: "string"},
                {name: "phone", type: "string"},
                {name: "state_code", type: "string"},
            ]
        });

        Ext.regStore("businesses", {
            model: 'Business',
            autoLoad: true,
            proxy: {
                type: 'scripttag',
                url: 'http://api.yelp.com/business_review_search' +
                    '?ywsid=' + YELP_KEY +
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
