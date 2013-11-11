HW4::Application.routes.draw do
  root :to => "home#index"

  get 'oauth/new' => 'oauth#new'
  get 'oauth/callback' => 'oauth#callback'
  get 'oauth/check' => 'oauth#check'
end
