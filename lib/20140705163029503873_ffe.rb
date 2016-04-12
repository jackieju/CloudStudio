require 'bomigration.rb'
class Ffe < Bomigration
  @@version=78
  @@udo_json=<<JSONEND
  {"desc":"","name":"ffe","type":"BO","fields":[{"name":"id","type":"integer","unique":true},{"default_value":"null","name":"avd","type":"string","length":1},{"default_value":"null","name":"unamed1","type":"string","length":1}],"ui":3115595,"version":78,"x":892,"y":216}
JSONEND
  cattr_accessor :udo_json
  
  def up
    create_udo_def({
        :name=>"ffe",
        :desc=>"",
        :fields=>[
            {
                :name=>"id",
                :type=>"integer"
            },
            {
                :name=>"avd",
                :type=>"string"
            },
            {
                :name=>"unamed1",
                :type=>"string"
            },

        ],
    }){|u| # you can also define columns by this way
        p "==>dasf"
        p "u:#{u.inspect}"
    }
    #add_index(:ffe, ["appid"], {:unique=>true})
    #add_index(:ffe, ["name"], {:unique=>true})
  end

  def down
    drop_udo :ffe
  end
end


