
module Anywhere
class BO
    def initialize(hash)
        hash.each do |k,v|
          self.instance_variable_set("@#{k}", v)
          self.class.send(:define_method, k, proc{self.instance_variable_get("@#{k}")})
          self.class.send(:define_method, "#{k}=", proc{|v| self.instance_variable_set("@#{k}", v)})
        end
      end

      def save
        hash_to_return = {}
        self.instance_variables.each do |var|
          hash_to_return[var.gsub("@","")] = self.instance_variable_get(var)
        end
        return hash_to_return
      end
      
  #     def method_missing(name, *args, &block) # :nodoc:
  #         p "--->object #{self} miss method #{name}"
  # #      (delegate || superclass.delegate).send(name, *args, &block)
  #         if (@obj)
  #             if @obj.respond_to?(name)
  #                 m = @obj.method(name)
  #                 if m
  #                     return m.call(*args)
  #                 else
  # 
  #                 end
  #             end
  #         end
  #         return query(name)
  #     end 
  def [](n)
      self.send(n.to_s)
  end
  
  def []=(n, v)
      self.instance_variable_set("@#{n}", v)
  end      
           
    def create_bo
    end
    
    def drop_bo
    end
    
    # by subclass
    def setup
        {
            :name=>"Abc",
            :type=>"udo"
        }
    end
    
    def create
        create_bo do |t|
        end
    end
    
    
    def drop
      drop_bo 
    end
end
end