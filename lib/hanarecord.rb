class HanaRecord < ActiveRecord::Base
    #def initialize(hash)
     #   p "set table name #{self.class.to_s}"
#        set_table_name self.class.to_s.upcase
     #   super
    #end
    def self.schema
        ActiveRecord::Base.connection.schema
    end
    def self.max_id
        sql = "select max(ID) from \"#{schema}\".\"#{table_name}\""
        # res = ActiveRecord::Base.connection.run(sql)
        # id = res[0][0]+1
        ret = ActiveRecord::Base.connection.select_value(sql)
        if ret != nil
            return ret
        else
           return 0
        end
    end
end
