class Hash
  #take keys of hash and transform those to a symbols
  def self.transform_keys_to_symbols(value)
    return value if not value.is_a?(Hash)
    hash = value.inject({}){|memo,(k,v)| memo[k.to_sym] = Hash.transform_keys_to_symbols(v); memo}
    return hash
  end
  def self.transform_keys_to_string(value)
    return value if not value.is_a?(Hash)
    hash = value.inject({}){|memo,(k,v)| memo[k.to_s] = Hash.transform_keys_to_string(v); memo}
    return hash
  end
  def normalize
      Hash.transform_keys_to_string(self)
      Hash.transform_keys_to_symbols(self)
      @normalized = true
  end
  def normalized?
      @normalized == true
  end
  #def []=(n, v)
  #    super
  #    @normalized = false
  #end
  #def merge!(h)
  #    super
  #    @normalized = false
  #end
  #def merge!(other_hash){|key, oldval, newval| block} 
  #end
  def method_missing(name, *args, &block) # :nodoc:
      #p "--->hash #{self} miss method #{name}", 10
#      (delegate || superclass.delegate).send(name, *args, &block)
      normalize if not normalized?
      v =  self[name.to_s]
      return v if v
      return self[name.to_sym]
  end
end