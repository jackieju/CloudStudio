#!/usr/bin/env ruby
ENV['RAILS_ENV'] = ARGV.first || ENV['RAILS_ENV'] || 'development'
p "===> config file #{File.expand_path(File.dirname(__FILE__) + "/../config/environment")}"
require File.expand_path(File.dirname(__FILE__) + "/../config/environment")
    def p(m)
        print m
        print "\n"
    end
require "jobs/deploy.rb"
module Rails
    class Logger
        def debug(m)
            print "#{m}\n"
        end
       def error(m)
            print "#{m}\n"
        end
    end
    def self.logger
        @log = Logger.new
        return @log
    end
end

########### main ############
p "process id #{$$}"
p "argments #{$*}"
# $*[0] development/production
# $*[1] method (e.g. "deploy" )
# $*[2] parameters of method (uid, ...) 
    # preload_modules
    s = $*[1]
        p "s == #{s}"
        if s == "deploy"
            if $*[3] == "on"
                deploy($*[2], "i027910", $*[4])
            else
                deploy($*[2])
            end
            p ">>>>>>end deploy"
        elsif s == "undeploy"

        end
p "dojob end===="