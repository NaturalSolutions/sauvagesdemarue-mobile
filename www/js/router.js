"use strict";

// ----------------------------------------------- The Application Router ------------------------------------------ //

app.Router = Backbone.Router.extend({

  routes: {
    'identification/:name' : 'viewIdentKeyFilter',
    'identification' : 'viewIdentKey',
    'taxonlist' : 'viewTaxonlist',
    'region' : 'viewRegions',
    'maregion/:name' : 'viewMaRegion',
    'taxonlist/:all' : 'viewTaxonlist',
    'taxonlistRegion/:region' : 'viewTaxonlistRegion',
    'taxondetail/:id/localisation/(:localisation)' : 'viewTaxonDetail',
    'addObs/:taxonId/localisation/(:localisation)' : 'viewFormAddObs',
    'addNonIdentifiee'  : 'viewFormNIOnbs',
    'addPasListe'  : 'viewFormPLOnbs',
    'addParcours(/:state)' : 'viewFormAddParcours',
    'myObservation' : 'viewTableMyObs',
    'ouSuisJe' : 'viewLocalisation',
    'credits' : 'viewCrédits',
    'utilisateur' : 'viewUtilisateur' ,
    '' : 'viewHomePage'
  },

  initialize: function() {
    app.globals.currentFilter = new Array();
    app.globals.regiontaxon = new Array();
    app.globals.currentFilterTaxonIdList = new Array();
    app.globals.currentRueList = new app.models.ParcoursDataValuesCollection;
    app.globals.cListAllTaxonsRegion = new app.models.TaxonLiteCollection();
    app.globals.regionTaxonCaracValuesCollection = new app.models.TaxonCaracValuesCollection();

    //Démarrage de l'écoute GPS
    app.utils.geolocalisation.watchCurrentPosition();
    // Keep track of the history of pages (we only store the page URL). Used to identify the direction
    // (left or right) of the sliding transition between pages.
    this.pageHistory = [];

    // Register event listener for back button troughout the app
    $('#content').on('click', '.header-back-button', function(event) {
        window.history.back();
        return false;
    });
  },
    
  goToLastPage: function() {
    window.history.back();
    return false;
  },
	
  viewHomePage: function() {
    var self= this;
    if ($(".loading-splash").length !== 0) {
      setTimeout(function() {
        $('body').css('background-color', '#28717E');
        $(".loading-splash").remove();
        $('#splash-screen').remove();
        var currentView = new app.views.HomePageView();
        self.displayView(currentView);
      }, 2000);
    }else{
      var currentView = new app.views.HomePageView({dirty : true});
      self.displayView(currentView);
    }   
  },
  
  viewLocalisation: function() {
    var currentView = new app.views.LocalisationPageView();
    this.displayView(currentView);  
  },

  viewCrédits: function() {
    var currentView = new app.views.CreditsPageView();
    this.displayView(currentView);  
  },

  viewUtilisateur: function() {
    var currentUser = new app.models.User({'userId': 1});
    var self = this;
    if (currentUser !== undefined) {
      currentUser.fetch({
          success: function(data) {
            var currentView = new app.views.UtilisateurPageView({model :data});
            self.displayView(currentView);
          }
      });
    }else{
      var newUser = new app.models.User();
      var currentView = new app.views.UtilisateurPageView({model :newUser});
      this.displayView(currentView);
    }
  },

  viewRegions: function() {
    var currentView = new app.views.RegionPageView();
    this.displayView(currentView);  
  },
  
  viewMaRegion : function(name) {
    var region;
    var taxonsPaca  = new app.models.TaxonLiteCollection();
    taxonsPaca.models = app.globals.cListAllTaxons.multiValueWhere({'commonName' : LISTE_PACA});
    app.globals.cListAllTaxonsRegion = taxonsPaca;

    //critères région
    //app.globals.regiontaxon = new app.models.CaracteristiqueDefValuesCollection();
    app.globals.regiontaxon = new Array();

    app.globals.cListAllTaxonsRegion.each(function(model){
      var id = model.get("taxonId");
      var taxon= new app.models.Taxon({"taxonId": id});
      taxon.fetch({
            success: function(data) { 
              data.get('caracValues').each(function(model) {
              app.globals.regionTaxonCaracValuesCollection  =  app.globals.regionTaxonCaracValuesCollection.add(model);
              var criM = new app.models.CaracteristiqueDefValue({'criteraValueId' : model.get('fk_carac_value')});
                criM.fetch({
                  success: function(dataCriM) {
                    var testDataCriM = $.inArray(dataCriM.get('criteraValueId'), app.globals.regiontaxon) > -1;
                    if (! testDataCriM) {
                     app.globals.regiontaxon.push(dataCriM.get('criteraValueId'));
                    }
                  }
                });
              },this);
            }
        });
    },this);
    var currentView = new app.views.MaRegionView({collection: app.globals.cListAllTaxonsRegion, region: name});
    this.displayView(currentView);
  },
  
  viewTaxonlistRegion : function(name) {
    var region;
    var taxons;
    if( app.globals.currentFilterTaxonIdList.length === 0 ){
      taxons = app.globals.cListAllTaxonsRegion;    
    }
    else {
      taxons  = new app.models.TaxonLiteCollection();
      taxons.models = app.globals.cListAllTaxonsRegion.multiValueWhere({'taxonId' :_.pluck(app.globals.currentFilterTaxonIdList, 'fk_taxon')}) ;
    }
    var currentView = new app.views.TaxonListView({collection: taxons, region: name});
    this.displayView(currentView);
  },

  viewIdentKey : function() {
    console.log('viewIdentKey viewIdentKey');
    var self = this;
    var cListAllCriterias = new app.models.CaracteristiqueDefsCollection();
    
    cListAllCriterias.fetch({
        success: function(data) {
          var currentView = new app.views.IdentificationKeyView({collection: data});
          self.displayView(currentView);
        }
    }) 
  },

  viewIdentKeyFilter : function(name) {
    var region = $.trim(name);
    var self = this;
    var cListAllCriterias = new app.models.CaracteristiqueDefsCollection();
    
    cListAllCriterias.fetch({
        success: function(data) {
          var currentView = new app.views.IdentificationKeyFilterView({collection: data, filtreRegion : app.globals.regiontaxon, region:name});
          self.displayView(currentView);
        }
    }) 
  },

  viewTaxonlist : function(all) {
    console.log('viewTaxonlist');
    var taxons;
    if( all || app.globals.currentFilterTaxonIdList.length === 0 ){
      taxons = app.globals.cListAllTaxons;    
    }
    else {
        taxons  = new app.models.TaxonLiteCollection();
        taxons.models = app.globals.cListAllTaxons.multiValueWhere({'taxonId' :_.pluck(app.globals.currentFilterTaxonIdList, 'fk_taxon')});
    }
    var currentView = new app.views.TaxonListView({collection: taxons});
    this.displayView(currentView);
  },
  
  viewTaxonDetail : function(id,localisation) {
    console.log('viewTaxonDetail');
    var self = this;
    var critereValeurtaxon = new app.models.CaracteristiqueDefValuesCollection();
    //Recupération des données du taxon
    var taxon= new app.models.Taxon({"taxonId": id});
    taxon.fetch({
          success: function(data) {

        //Recupération de tous les critères de la clé
           var cListAllCriterias = new app.models.CaracteristiqueDefsCollection();
           
           cListAllCriterias.fetch({
               success: function(critAll) {
                 var currentView = new app.views.TaxonDetailView({model: data, localisation:localisation, collection : critAll});
                 self.displayView(currentView);
               }
           }) 

          }
      });
   
  },

  viewFormAddObs : function(taxonI,localisation) {
    var idCurrentRue = undefined;
    var self = this;
    setTimeout(function() {
      app.utils.geolocalisation.getCurrentPosition();
      if (typeof(app.utils.geolocalisation.currentPosition) !== 'undefined') {
        var selectedTaxon = app.globals.cListAllTaxons.where({taxonId:parseInt(taxonI)});
        if (app.globals.currentrue !== undefined) {
          var idCurrentRue = app.globals.currentrue.get('id');
        }
        var obs = new app.models.OccurenceDataValue({"fk_taxon" : taxonI, fk_rue : idCurrentRue ,"name_taxon" : selectedTaxon[0].get('commonName')});

        obs.set('latitude',app.utils.geolocalisation.currentPosition.latitude );
        obs.set('longitude',app.utils.geolocalisation.currentPosition.longitude);
        
        var currentView = new app.views.AddSauvageOccurenceView({model:obs, localisation : localisation});
        self.displayView(currentView);   
      }
      else{
        sauvages.notifications.gpsNotStart();
        self.goToLastPage();
      }
    },500);
    
  },
  
  viewFormNIOnbs  : function() {
    var self = this;
    setTimeout(function() {
      app.utils.geolocalisation.getCurrentPosition();
      if (typeof(app.utils.geolocalisation.currentPosition) !== 'undefined') {
        var obs = new app.models.OccurenceDataValue({fk_rue:app.globals.currentrue.get('id'), "name_taxon" : "inconnue"});
        obs.set('latitude',app.utils.geolocalisation.currentPosition.latitude );
        obs.set('longitude',app.utils.geolocalisation.currentPosition.longitude);
        var currentView = new app.views.AddSauvageOccurenceNonIdentifierView({model:obs});
        self.displayView(currentView);   
      }
      else{
        sauvages.notifications.gpsNotStart();
        self.goToLastPage();
      }
    },500);
    
  },
  viewFormPLOnbs : function() {
    var self = this;
    setTimeout(function() {
      app.utils.geolocalisation.getCurrentPosition();
      if (typeof(app.utils.geolocalisation.currentPosition) !== 'undefined') {
        var obs = new app.models.OccurenceDataValue({fk_rue:app.globals.currentrue.get('id'), "name_taxon" : ""});
        obs.set('latitude',app.utils.geolocalisation.currentPosition.latitude );
        obs.set('longitude',app.utils.geolocalisation.currentPosition.longitude);
        var currentView = new app.views.AddSauvageOccurencePasDansListeView({model:obs});
        self.displayView(currentView);   
      }
      else{
        sauvages.notifications.gpsNotStart();
        self.goToLastPage();
      }
    },500);
    
  },
  
  viewFormAddParcours : function(state) {
    var self = this;
    //Teste si il ya des données de géolocalisation
    if (typeof(app.utils.geolocalisation.currentPosition) !== 'undefined') {
      //teste si il n'y a pas de rue en cours
      if (typeof( app.globals.currentrue) === 'undefined') {
        var collParcours = new app.models.ParcoursDataValuesCollection();
        var collParcoursAll = collParcours.fetch({
          success: function(data) {
            var modelRueEncours = data.findWhere({'state': 0});
            if (modelRueEncours !== undefined) {
              app.globals.currentrue = modelRueEncours;
              var currentView = new app.views.AddSauvageRueView({model:modelRueEncours});
              self.displayView(currentView);  
            }else{
              app.globals.currentrue = new app.models.ParcoursDataValue();
              var currentView = new app.views.AddSauvageRueView({model:app.globals.currentrue});
              self.displayView(currentView);  
            }
        }
      
      });
		      
      }
      else {
        var currentRueId = app.globals.currentrue.get('id');
        var collObs = new app.models.OccurenceDataValuesCollection;
          collObs.fetch({
              success: function(data) {
              var currentView = new app.views.AddSauvageRueView({model:app.globals.currentrue, collection: data});
              self.displayView(currentView);
            }
          });
      }
      //Supprime les filtres de la clé
      if (app.globals.currentFilter !== undefined) {
        app.globals.currentFilter.length = 0;
        app.globals.currentFilterTaxonIdList.length = 0;
      }
    }
    else{
      sauvages.notifications.gpsNotStart();
      this.goToLastPage();
    }
  },

  viewTableMyObs : function() {
    var self = this;
    console.log('viewTableMyObs');
    var myObsColl = new app.models.OccurenceDataValuesCollection();
    var mesRuesColl = new app.models.ParcoursDataValuesCollection();
    myObsColl.fetch({
      success: function(data) {
        mesRuesColl.fetch({
          success: function(parcours) {
            var currentView = new app.views.ObservationListView({collection: data, parcours : parcours});
            self.displayView(currentView);
          }
        });
      }
    });
   
  },
  _currentView: null,

  displayView: function (view) {
      if (this._currentView) {
        //this._currentView.transitionOut();
        this._currentView.remove();
        this._currentView.off();
        $('.elem-right-header').empty();
      }
      //view.render({ page: true });     
      //view.transitionIn();
      //$('.page').addClass('transition-none');
      this._currentView = view;
      $('#content').append(view.el);
      view.render();
  },


});
