require 'utility.rb'

def report_progress(n)
    p "#=progress= #{n}#"   
end

def report(m)
    p m
end
# =================
# = Deploy an App =
# =================
def deploy(appid, username="i027910", tenantid=1, schema="I027910_MASTER")
    p "Deploy app #{appid} for user #{username} on tenant #{tenantid} using schema #{schema}"
     app_root_dir = repo_ws_path(appid, username)
        ext_root_dir = "#{app_root_dir}/app/#{$FS_EXT_ROOT}"
        msg = ""
     
    report_progress(1)
        # deploy script
        if FileTest::exists?(ext_root_dir) 
            dest = "#{$FS_RT_EXT_ROOT}/#{appid}"
            begin
                FileUtils.mkdir_p(dest)
                p "copy #{ext_root_dir} to #{dest}"
                FileUtils.copy_entry(ext_root_dir, "#{dest}/")
            rescue Exception => e
                p e.inspect
                p e.backtrace[0..e.backtrace.size-1].join("\n\r")
                error("Deploy failed:<pre>"+ e.message+"</pre>")
                return
            end
        end
        p "deploy script ok"
        report_progress(10)
        
        msg += "<div>Deploy script ok</div>"
        
        p "deploy udo"
        begin
            # migrations = all_migrations(appid)
            #         
            # migrations.each{|m|
            #     begin
            #         eval "load '#{m[:filename]}'"
            #         eval "#{m[:cls]}.new().up"
            #     rescue Exception=>e
            #         p e.inspect
            #         p e.backtrace[1..e.backtrace.size-1].join("\n\r")
            #     end
            # }
            
        
load "migration.rb"
load "schema_statements.rb"
load "anwschema.rb"
load "bomigration.rb"

            config={
                :adapter=> "odbc",
                :dsn=> "DSN1",
                :username=> "system",
                :password=> "manager",
                :column_store=> "true",
            #    :schema=>"abcddde"
                # :schema=>"I027910_MASTER"
                :schema=>schema
            }

            ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))
       
#ActiveRecord::Base.connection.execute("INSERT INTO \"I027910_MASTER\".\"schema_migrations\" VALUES ('dd', '2014070620141747944')")
#p "done !!"
            # ActiveRecord::Migrator.run(:down, "db/migrate/", version)   

            ActiveRecord::Migrator.migrate(appid, "#{repo_ws_path(appid, username)}/app/migrate", nil)
            # p "update \"config[:schema]\".\"METADATAVERSION\" SET VERSION=VERSION+1"
            # ActiveRecord::Base.connection.exectue("update \"config[:schema]\".\"METADATAVERSION\" SET VERSION=VERSION+1")
            p "deploy udo success"
            
        rescue Exception => e
            p e.inspect
            p e.backtrace[0..e.backtrace.size-1].join("\n\r")
            error("Deploy failed:<pre>"+ e.message+"</pre>")
            # ActiveRecord::Migrator.rollback(appid)
            return
        end
        report_progress(50)
        
        p "deploy ok"
        msg += "<div>Deploy BO ok</div>"
        
        
        
        # deploy ui
        ui_root_dir = "#{app_root_dir}/app/ui_root/ui_root_u"
        # tenantid=1
        if FileTest::exists?(ui_root_dir) 
            dest = "#{$SETTINGS[:ui_root_dir]%[tenantid]}/#{appid}"
            p "uid dest path =#{dest}"
            begin
                FileUtils.mkdir_p(dest)
                p "copy #{ui_root_dir} to #{dest}"
                FileUtils.copy_entry(ui_root_dir, "#{dest}/")
            rescue Exception => e
                p e.inspect
                p e.backtrace[0..e.backtrace.size-1].join("\n\r")
                error("Deploy failed:<pre>"+ e.message+"</pre>")
                return
            end
        end
        report_progress(80)
        new_id = ActiveRecord::Base.connection.select_value("SELECT #{config[:schema]}.EXTENSIONAPPREGISTRY_SEQ.NEXTVAL from dummy")
        # table EXTENSIONAPPREGISTRY
        # hdbsql H00=> SELECT COLUMN_NAME,DATA_TYPE_NAME,LENGTH FROM TABLE_COLUMNS WHERE TABLE_NAME ='EXTENSIONAPPREGISTRY' and schema_NAME='I027910_MASTER' order by position        
        # COLUMN_NAME,DATA_TYPE_NAME,LENGTH
        # "ID","BIGINT",19
        # "EXTENSIONID","NVARCHAR",50
        # "EXTENSIONVERSION","NVARCHAR",50
        # "OWNERCODE","INTEGER",10
        # "CREATEDATE","TIMESTAMP",27
        # "USERSIGN","BIGINT",19
        # "UPDATEDATE","TIMESTAMP",27
        # "USERSIGN2","BIGINT",19
        # "INSTANCE","BIGINT",19
        t = Time.now
        time = t.strftime("%Y-%m-%d %H:%M:%S.000000000")
        sql = "insert into #{config[:schema]}.EXTENSIONAPPREGISTRY values(#{new_id}, '#{appid}', '1', 1, '#{time}', 1, '#{time}', 2, 1 )"
        ActiveRecord::Base.connection.execute(sql)
        p "deploy UI ok"      
        msg += "<div>Deploy UI ok</div>"
        
        report_progress(100)
        
        
        # dev_server_b1_url = @user.dev_server_b1_url
        msg = "Deploy successfully\n#{msg}"
end