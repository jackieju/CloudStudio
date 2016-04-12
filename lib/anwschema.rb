module ActiveRecord
  # Allows programmers to programmatically define a schema in a portable
  # DSL. This means you can define tables, indexes, etc. without using SQL
  # directly, so your applications can more easily support multiple
  # databases.
  #
  # Usage:
  #
  #   ActiveRecord::Schema.define do
  #     create_table :authors do |t|
  #       t.string :name, :null => false
  #     end
  #
  #     add_index :authors, :name, :unique
  #
  #     create_table :posts do |t|
  #       t.integer :author_id, :null => false
  #       t.string :subject
  #       t.text :body
  #       t.boolean :private, :default => false
  #     end
  #
  #     add_index :posts, :author_id
  #   end
  #
  # ActiveRecord::Schema is only supported by database adapters that also
  # support migrations, the two features being very similar.
  class AnwSchema < Migration
    private_class_method :new

    # Eval the given block. All methods available to the current connection
    # adapter are available within the block, so you can easily use the
    # database definition DSL to build up your schema (+create_table+,
    # +add_index+, etc.).
    #
    # The +info+ hash is optional, and if given is used to define metadata
    # about the current schema (currently, only the schema's version):
    #
    #   ActiveRecord::Schema.define(:version => 20380119000001) do
    #     ...
    #   end
    def self.define(info={}, &block)
p "anwschema.define"
      instance_eval(&block)

      unless info[:version].blank?
        initialize_schema_migrations_table
        assume_migrated_upto_version info[:version]
      end
    end
    
    def self.initialize_schema_migrations_table
p "initialize_schema_migrations_table=>>>>"
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

        end
end # def initialize_schema_migrations_table

      def self.assume_migrated_upto_version(version)
        p "assume_migrated_upto_version"
        version = version.to_i
        sm_table = quote_table_name(ActiveRecord::Migrator.schema_migrations_table_name)

        migrated = select_values("SELECT \"version\" FROM #{sm_table} order by \"version\" asc").map(&:to_i)
#        versions = Dir['db/migrate/[0-9]*_*.rb'].map do |filename|
 #         filename.split('/').last.split('_').first.to_i
  #      end

        if migrated.size==0 || migrated[migrated.size-1]<version
          execute "INSERT INTO #{sm_table} (\"version\") VALUES ('#{version}')"
        end
p "version:#{version}, migrated:#{migrated.inspect}"
=begin
p "versons:#{versions.inspect}, migrated:#{migrated.inspect}"
        inserted = Set.new
        (versions - migrated).each do |v|
          if inserted.include?(v)
            raise "Duplicate migration #{v}. Please renumber your migrations to resolve the conflict."
          elsif v < version
            execute "INSERT INTO #{sm_table} (\"version\") VALUES ('#{v}')"
            inserted << v
          end
        end
=end
      end # def assume_migrated_upto_version
  end # class 
end # module ActiveRecord
