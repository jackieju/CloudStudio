# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_oce_session',
  :secret      => '5984474ffd3e9b7d90abf6bd5d57bf736ee71125dc9b72142b4a235c73c91c97c0a1a9c2100074b43fb423a602f52f590b0eec416c143f98142a149adc1c30c9'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
