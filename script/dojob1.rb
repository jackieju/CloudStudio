#!/usr/bin/env ruby

ENV['RAILS_ENV'] = ARGV.first || ENV['RAILS_ENV'] || 'development'
require File.expand_path(File.dirname(__FILE__) + "/../config/environment")
require "active_record/connection_adapters/abstract/connection_specification.rb"
require 'anwschema.rb'
=begin
module ActiveRecord
  module ConnectionAdapters # :nodoc:
    module SchemaStatements
def initialize_schema_migrations_table
p "fdafa=>>>>"
        sm_table = ActiveRecord::Migrator.schema_migrations_table_name
p "initialize_schema_migrations_table #{sm_table}"
        ts = tables()
        ts = [] if !ts
p "ts=>#{ts.inspect}"
        unless ts.detect { |t|
           p "table name #{t}" 
         t == sm_table }

p "schema table not found"
          create_table(sm_table, :id => false) do |schema_migrations_table|
            schema_migrations_table.column :version, :string, :null => false
          end
          add_index sm_table, :version, :unique => true,
            :name => "#{Base.table_name_prefix}unique_schema_migrations#{Base.table_name_suffix}"

          # Backwards-compatibility: if we find schema_info, assume we've
          # migrated up to that point:
          si_table = Base.table_name_prefix + 'schema_info' + Base.table_name_suffix
p "si_table=#{si_table}"
        ts = tables()
        ts = [] if !ts
          if ts.detect { |t|
p "ts=>#{ts.inspect}"

 t == si_table }

            old_version = select_value("SELECT version FROM #{quote_table_name(si_table)}").to_i
            assume_migrated_upto_version(old_version)
            drop_table(si_table)
          end
        end
end
end
end
end
=end

tenant = "testjj1"
config={
    :adapter=> "odbc",
    :dsn=> "DSN1",
    :username=> "system",
    :password=> "manager",
    :column_store=> "true",
    #:schema=> I027910_MASTER2   
    :schema=>tenant
}
ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))
begin
ActiveRecord::Base.connection.execute("drop schema #{config[:schema]} CASCADE")
rescue
end
ActiveRecord::Base.connection.execute("create schema #{config[:schema]}") 
ActiveRecord::Base.connection.execute("set schema #{config[:schema]}") 
ActiveRecord::Base.connection.execute("select * from \"I027910_MASTER\".\"apps\"")

ActiveRecord::AnwSchema.define(:version => 20140514091125) do

  create_table "apps", :force => false do |t|
    t.string   "appid"
    t.string   "name"
    t.string   "desc"
    t.integer  "uid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "apps", ["appid"], :name => "index_apps_on_appid", :unique => true
  add_index "apps", ["name"], :name => "index_apps_on_name", :unique => true

end
p "=====>create apps2---"
ActiveRecord::AnwSchema.define(:version => 20140514091126) do

  create_table "apps2", :force => false do |t|
    t.string   "appid"
    t.string   "name"
    t.string   "desc"
    t.integer  "uid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "apps2", ["appid"], :name => "index_apps2_on_appid", :unique => true
  add_index "apps2", ["name"], :name => "index_apps2_on_name", :unique => true

end
p "=====>create apps3---"
ActiveRecord::AnwSchema.define(:version => 20140514091120) do

  create_table "apps3", :force => false do |t|
    t.string   "appid"
    t.string   "name"
    t.string   "desc"
    t.integer  "uid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "apps3", ["appid"], :name => "index_apps3_on_appid", :unique => true
  add_index "apps3", ["name"], :name => "index_apps3_on_name", :unique => true

end

def deploy_udo_to_tenant(tentant, base_dir)
    # initialize connection to hana
    config={
        :adapter=> "odbc",
        :dsn=> "DSN1",
        :username=> "system",
        :password=> "manager",
        :column_store=> "true",
        :schema=>tenant
    }
    
    ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))
    
    # migrate to this version
    load "20140705163029503873_ffe.rb"
    Ffe.new.up
end