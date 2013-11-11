class OauthController < ApplicationController
  def new
    oauth_url = "https://cs3213.herokuapp.com/oauth/new?client_id=#{client_id}&client_secret=#{client_secret}&redirect_uri=#{redirect_url}"
    redirect_to oauth_url
  end

  def callback
    if params[:code]
      response = Faraday.post("https://cs3213.herokuapp.com/oauth/token.json?client_id=#{client_id}&client_secret=#{client_secret}&code=#{params[:code]}")
      if access_token = JSON.parse(response.body)['access_token']
        session[:access_token] = access_token
        redirect_to :root
      else
        raise response.body.inspect
      end
    end
  end

  def check
    respond_to do |format|
      format.json { render :json => session[:access_token].to_json }
    end
  end

  private

  def client
    OAuth2::Client.new('73e47de1d3c355f9d99ecc2fea99ebb3', '265e4e4f2ed3c5e10b9208d4ded915c7',
      site: 'https://cs3213.herokuapp.com',
      authorize_url: '/oauth/new')
  end

  def client_id
    '73e47de1d3c355f9d99ecc2fea99ebb3'
  end

  def client_secret
    '265e4e4f2ed3c5e10b9208d4ded915c7'
  end

  def redirect_url
    CGI.escape("#{request.protocol}#{request.host_with_port}/oauth/callback")
  end
end
