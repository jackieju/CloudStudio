def p(m, stack=0)
    if stack >0
         begin
            raise Exception.new
        rescue Exception=>e
            if e.backtrace.size >=2 
                stack  += 1
                stack = e.backtrace.size-1 if stack >= e.backtrace.size
                trace = e.backtrace[1..stack].join("\n") 
                m = "#{m}\n#{trace}"
            end
        end
    end
    
    Rails.logger.debug(m)
    puts m
end
def warn(m)
    # Rails.logger.warn(m)
end
def err(m)
    if m.is_a?(Exception)
        m = "!!!Exception:#{m.inspect}:\n#{m.backtrace[0..9].join("\n")}"
    end
    p m
    Rails.logger.error(m)
end
