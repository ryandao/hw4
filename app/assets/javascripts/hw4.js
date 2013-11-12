$('document').ready(function() {
  App = Skull.Application.create();

  App.IndexRoute = Skull.Route.extend({
    execute: function() {
      App.router.navigate('movies');
    }
  });

  // OAuth
  $.ajax({
    url: window.location.origin + "/oauth/check",
  }).done(function(access_token) {
    App.access_token = access_token
  });
  // End OAuth

  // Model
  App.Movie = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies.json';
    },

    recordUrl: function(id) {
      return 'http://cs3213.herokuapp.com/movies/' + id + '.json';
    }
  });

  App.Review = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '/reviews.json';
    }
  })
  // End Model

  // Movie index
  App.MoviesController = Skull.Controller.extend({
    isLoading: true,
    pageTitle: 'CS3213Movies',
    pageNum: 1,

    initialize: function() {
      this.set('movies', App.store.find(App.Movie));

      var controller = this;
      this.movies.addObserver('isLoaded', function() {
        controller.set('isLoading', ! this.isLoaded);
      });
    },

    nextPage: function() {
      this.set('pageNum', this.pageNum + 1);
    },

    previousPage: function() {
      if (this.pageNum == 1) { return; }
      this.set('pageNum', this.pageNum - 1);
    },

    movePage: function() {
      this.set('isLoading', true);
      this.set('movies', App.store.findQuery(App.Movie, { page: this.pageNum }));
    }.observes('pageNum'),

    navigateMovie: function(e, movie) {
      App.router.navigate("movies/" + movie.id);
    },

    navigateCreate: function() {
      App.router.navigate("movies/new");
    },

    updateMoviesObserver: function() {
      var controller = this;
      this.movies.addObserver('isLoaded', function() {
        controller.set('isLoading', ! this.isLoaded);
      });
    }.observes('movies'),
  });

  App.MoviesView = Skull.View.extend({
    templateId: 'movies',
    rootEl: '#wrapper'
  });

  App.MoviesRoute = Skull.Route.extend({
    controllerClass: App.MoviesController,
    viewClass: App.MoviesView
  });

  // End Movie index

  // Movie view
  App.MovieController = Skull.Controller.extend({
    movie_id: Skull.P,
    isLoadingMovie: true,
    isLoadingReviews: true,

    deleteMovie: function(e) {
      e.preventDefault();

      if(!App.access_token){
        window.location = window.location.origin + "/oauth/new";
        return
      }

      var _this = this;
      _this.set('isDeletingMovie',true);
      $.ajax({
        url: 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '.json',
        type: 'DELETE',
        data: {
          access_token: App.access_token
        },

        success: function(data) {
          _this.set('isDeletingMovie',false);
          App.router.navigate('movies');
          alert("Deleted!");
        },

        error: function() {
          _this.set('isDeletingMovie',false);
          alert('You cannot delete this movie!');
        }
      })
    },

    addReview: function(e) {
      e.preventDefault();
      console.log(App.access_token);
      if(!App.access_token){
        window.location = window.location.origin + "/oauth/new"
        return
      }
      var controller = this;
      this.set('isAddingReview', true);
      $('#new-review-form').ajaxSubmit({
        url: 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '/reviews.json',
        type: 'POST',
        data: {
          access_token: App.access_token
        },

        success: function(data) {
          controller.set('isAddingReview', false);
          controller.set('reviews', App.store.find(App.Review));
        },

        error: function(error) {
          controller.set('isAddingReview', false);
        }
      });
    },

    deleteReview: function(e, review_id) {
      e.preventDefault();
      if(!App.access_token){
        window.location = window.location.origin + "/oauth/new"
        return
      }

      var _this = this;
      _this.set('isDeletingReview',true);
      $.ajax({
        url: 'http://cs3213.herokuapp.com/movies/' + _this.movie_id + '/reviews/' + review_id + '.json',
        type: 'DELETE',
        data: {
          access_token: App.access_token
        },

        success: function(data) {
          _this.set('isDeletingReview',false);
          _this.set('reviews', App.store.find(App.Review));
        },

        error: function(error) {
          if (error.status == 401) {
            alert("You don't have permission to do this");
          }
          _this.set('isDeletingReview',false);
        }
      })
    }
  });

  App.MovieView = Skull.View.extend({
    rootEl: '#wrapper',
    templateId: 'movie_view'
  });

  App.MovieViewRoute = Skull.Route.extend({
    controllerClass: App.MovieController,
    viewClass: App.MovieView,

    execute: function(movie_id) {
      var record = App.store.find(App.Movie, movie_id);
      var route = this;

      this.controller.set('movie', record);
      this.controller.set('movie_id', movie_id);

      // Hack to pass movie_id to review model class
      var controller = this.controller;
      App.Review.prototype.movie_id = movie_id;
      this.controller.set('reviews', App.store.find(App.Review));
      this.controller.reviews.addObserver('isLoaded', function() {
        controller.set('isLoadingReviews', ! this.isLoaded);
      });

      this._super();
      record.recordDidLoad = function() {
        controller.set('isLoadingMovie', false);
        route.view.render();
      };
    }
  });
  // End Movie view

  // Movie new
  App.MoviesNewController = Skull.Controller.extend({
    submit: function(e) {
      e.preventDefault();

      $('#new-movie-form').ajaxSubmit({
        url: 'http://cs3213.herokuapp.com/movies.json',
        type: 'POST',
        data: { access_token: App.access_token },

        success: function(data) {
          App.router.navigate('movies/' + data.id);
        },

        error: function(error) {
          alert("Could not save the movie. Please try again.");
        }
      });
    }
  });

  App.MoviesNewView = Skull.View.extend({
    templateId: 'movies-new',
    rootEl: '#wrapper'
  });

  App.MoviesNewRoute = Skull.Route.extend({
    controllerClass: App.MoviesNewController,
    viewClass: App.MoviesNewView,
  });
  // End Movie new

  App.router.define({
    '': App.IndexRoute,
    'movies': App.MoviesRoute,
    'movies/:id': App.MovieViewRoute,
    'movies/new': App.MoviesNewRoute
  });

  App.start();
});
