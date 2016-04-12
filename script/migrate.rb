ENV['RAILS_ENV'] = ARGV.first || ENV['RAILS_ENV'] || 'development'
require File.expand_path(File.dirname(__FILE__) + "/../config/environment")
require "active_record/connection_adapters/abstract/connection_specification.rb"
require 'anwschema.rb'
require 'bomigration.rb'


# initialize connection to hana
config={
    :adapter=> "odbc",
    :dsn=> "DSN1",
    :username=> "system",
    :password=> "manager",
    :column_store=> "true",
    :schema=>"abcddd"
}

ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))

#ActiveRecord::Base.connection.execute("create schema #{config[:schema]}") 

# migrate to this version
load "20140705163029503873_ffe.rb"
#Ffe.new.down
Ffe.new.up
