# require 'base64'
require 'cgi'
require 'utility.rb'

class AppController < ApplicationController
    
    def list
        @apps = App.find_by_sql("select * from apps where uid=#{@user.id}")
    end
    
    def app
    end
    
    def delapp
        repo = appid = params[:appid]
        
        if !repo || repo == ""
            error("invalid repository name")
            return
        end
        
        # r = system "cd #{$SETTINGS[:repo_root]}\n
        #        git init --bare #{repo}.git"
        
        # p "system call return #{r}"
        # 
        begin
            p "appid=>#{appid}"
            rs = ActiveRecord::Base.connection.execute("delete from apps where appid='#{appid}'")
        rescue Exception=>e
            error("delet app from db failed #{e.inspect}")
            return
        end
        
        begin
            FileUtils.rm(repo_ws_path(appid))
        rescue Exception=>e
            error("delete app files failed #{e.inspect}")
            return
        end       
        success()
    end
    
    
    def get_appinfo_from_appstore
        data = http_post($SETTINGS[:appstore_query_app_url], {:appid=>appid})
        p "--->data:#{data}"
        query_ret = JSON.parse(data)
        if query_ret['error']
            error(query_ret['error'])
            return
        end
        return  query_ret
    end
    def ld
=begin test CORS for cross-domain        
        p "==>method:#{request.method}"
        p "==>origin:#{request.headers['Origin']}"
        if request.headers['Origin']
            p ' has origin'
            response.headers['Access-Control-Allow-Origin']="*"
            # response.headers['Access-Control-Allow-Origin']=request.headers['Origin']
            # response.headers['Access-Control-Allow-Methods']="GET, POST, PUT"
            # response.headers['Access-Control-Allow-Credentials']= "true"
            # response.headers['Access-Control-Expose-Headers']= "Cache-Control,Content-Language,Content-Type,Expires,Last-Modified,Pragma"
        end
=end        
        p "check_session1"
        if !check_session
            return
        end
        p "===>ld"
        appid= params[:appid]
=begin    
    # test odbc adapter
    
        rs = App.find_by_sql("select * from apps where appid='#{appid}'")
        if rs == nil || rs.size == 0
            error("No such App")
            return
        end
        app = rs[0]
        #ActiveRecord::Base.connection.execute("select * from I027910_master.HLD1")
ActiveRecord::Schema.define(:version => 20140514091125) do

  create_table "apps", :force => true do |t|
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
        
        App.new({
         :appid=>rand(1000),
         :name=>"fdadf#{rand(1000)}"
        }).save!
        rs = App.find_by_sql("select * from apps")
        p "====>#{rs.inspect}"

        rs = ActiveRecord::Base.connection.execute("select 'hldcode', 'strdate' from I027910_master.HLD1")
        p "===> #{rs.inspect}"
        p "===> #{rs[0].class}"

        #App.find(0)

        rs = ActiveRecord::Base.connection.execute("insert into I027910_MASTER.HLD1 VALUES( '2012','2010-10-01 00:00:00.000000000','2010-10-03 00:00:00.000000000','LL')")
=end        

# TODO
# query app api should be provided by a stable "internal only" service 
        #query_ret = get_appinfo_from_appstore()
        
        
        # for test
        query_ret = {}
        
        repo = appid
        repo_url = repo_url(appid)
        p "repo_url:#{repo_url}"
        
        if appid.end_with?(".git")
            appid = appid[0..appid.size-5]
        end
        query_ret[:name] = appid
        fname_config = repo_ws_path(appid)+"/.git/config"
        p "fname_config:#{fname_config}"
        # clone if not yet
        if File.exists?(fname_config) == false
            begin 
               # Git2.clone(repo, @user.name)
               Git2.clone(repo_url, @user.name)
            rescue Exception=>e
                error("project not exits")
                return
            end
        end
            
        # pull if not yet
        # Git2.pull(repo, @user.name)
        
        # json = load_appinfo(repo)
        
        json = load_appinfo2(repo)
        p "query_ret:#{query_ret.to_json}"
        p json.inspect
        p "===>"+json["name"]
        ret = {
            :data_root=>json["v"],
            :info=>query_ret
        }
        p ret.to_json


        render :text=>ret.to_json
        
    end
    
    # /project/extension/untitle1.rb => {
    # :path=>"/project/extension/Untitled1.rb",
    # :cat2=>"Untitled1.rb", 
    # :project=>"project",
    # :cat1=>"extension", 
    # :relative_dir=>"extension", 
    # :relative_path=>"extension/Untitled1.rb", 
    # :fname=>"Untitled1.rb"
    # }
    # save file to ./tmp/workspaces/i027910/rrr/app/extension/Untitled1.rb
    def fileInfoFromPath(path)
        p "===>path #{path}"
        b = path.split('/')
        fname = b[b.size-1]
        if path.start_with?("/")
            b = b[1..b.size-1]
        end
            prj = b[0]
         p "===>prj=#{prj} #{b.size}"
         cat = b[1]
         cat2 = nil
         if (b.size > 2)
             cat2 = b[2]
         end
        r =  {
             :path=>path,
             :project=>prj,
             :fname=>fname,
             :cat1=>cat,
             :cat2=>cat2,
             :relative_path=>b[1..b.size-1].join("/"),
             :relative_dir=>b[1..b.size-2].join("/")

         }
         p r
        return {
            :path=>path,
            :project=>prj,
            :fname=>fname,
            :cat1=>cat,
            :cat2=>cat2,
            :relative_path=>b[1..b.size-1].join("/"),
            :relative_dir=>b[1..b.size-2].join("/")
            
        }
    end
    
    # rename file
    # appid:
    # fname: path,
    # name: new name,
    # type: node.type
    def ren
        appid = params[:appid]
        path = params[:fname]
        type = params[:type] 
        fi= fileInfoFromPath(path)
        new_name = params[:name]
        fi= fileInfoFromPath(path)
        fname = fi[:fname]        
        repo = appid
        dir_path = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
        file_path = "#{dir_path}/#{fname}"
        new_file_path = "#{dir_path}/#{new_name}"
        # the path used by git commit
        git_relative_path = "app/#{fi[:relative_path]}"
        git_newfile_rpath = "app/#{fi[:relative_dir]}/#{new_name}"
        
        begin
            if (!FileTest::exists?(file_path) )
                error("File not exists")
                return
            end
            File.rename(file_path, new_file_path)
            
            Git2.add_and_commit(appid, @user.name, git_newfile_rpath)
            
        rescue Exception=>e
           # logger.error e
            p e.inspect
            p e.backtrace[1..e.backtrace.size-1].join("\n\r")
        end
        
        success()
    
    end
    
    # save file
    def sf
        appid = params[:appid]
        path = params[:fname]
        type = params[:type]
        content = params[:content]
        isnew = params[:isnew]
        
        p "content:#{content}"
        fi= fileInfoFromPath(path)
        fname = fi[:fname]
        
        if type == 'code'
            
        elsif type == 'bo'
            
        end
        repo = appid
        begin
            
            dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
            FileUtils.makedirs(dir)
            # logger.info("===========>#{dir}/#{id}<====")
            p "===>save to file #{dir}/#{fname}"
            
            file_path = "#{dir}/#{fname}"
            if isnew == 'true' && FileTest::exists?(file_path) 
                error("Cannot add file #{fname}, file already exists")
                return 
            end
            
            aFile = File.new("#{dir}/#{fname}","w")
            aFile.puts content
            aFile.close
            p "===>save to file #{dir}/#{fname} ok"
            relative_path = "app/#{fi[:relative_path]}"
            if isnew == 'true'
                Git2.add_and_commit(repo, @user.name, relative_path)
            else
                # Git2.commit(repo, @user.name, relative_path)
            end
          rescue Exception=>e
            # logger.error e
            p e.inspect
            p e.backtrace[1..e.backtrace.size-1].join("\n\r")
          end
          
          if isnew == 'true'
              r,m = update_to_appinfo(appid, fi, "add")
          else
              r,m = update_to_appinfo(appid, fi)
          end
                 
            if r == false
                error(m)
                return
            end
          
          # save_appinfo(appid)
          
          # Git2.push(repo, @user.name)
          success()
    end
    
    def migrated
        appid = params[:appid]
        @list = []
        begin
            list = ActiveRecord::Migrator.get_all_versions
            @list = @list.concat(list).reverse
        rescue Exception=>e
            p e
        end
    end
    def tenants
        @list = [
            {
                :id=>"1",
                :name=>"test1"
            }
        ]
    end
    # deploy to dev environment
    # appid 
    def deploy
        appid = params[:appid]
        app_root_dir = repo_ws_path(appid)
        ext_root_dir = "#{app_root_dir}/app/#{$FS_EXT_ROOT}"
        msg = ""
        
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
                :schema=>"I027910_MASTER"
            }

            ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))
       
#ActiveRecord::Base.connection.execute("INSERT INTO \"I027910_MASTER\".\"schema_migrations\" VALUES ('dd', '2014070620141747944')")
#p "done !!"
            # ActiveRecord::Migrator.run(:down, "db/migrate/", version)   

            ActiveRecord::Migrator.migrate(appid, "#{repo_ws_path(appid)}/app/migrate", nil)
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
        p "deploy ok"
        msg += "<div>Deploy BO ok</div>"
        
        
        
        # deploy ui
        ui_root_dir = "#{app_root_dir}/app/ui_root/ui_root_u"
        tenantid=1
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
        
        
        
        dev_server_b1_url = @user.dev_server_b1_url
        msg = "Deploy successfully\n#{msg}"
        success(msg, {:url=>"#{dev_server_b1_url}"})
        
        
    #    /opt/share/sfaattachment/
     #   \T1\rtspace\com.cid.oms\src\resources\UI-INF
    end
 
        def undeployto
            appid = params[:appid]
            version = params[:v]
            
            app_root_dir = repo_ws_path(appid)
            ext_root_dir = "#{app_root_dir}/app/#{$FS_EXT_ROOT}"

            # deploy script
            if FileTest::exists?(ext_root_dir) 
                dest = "#{$FS_RT_EXT_ROOT}/#{appid}"
                begin
                    p "rm #{ext_root_dir}"
                    
                    FileUtils.rm_rf(dest)
                rescue Exception => e
                    p e.inspect
                    p e.backtrace[0..e.backtrace.size-1].join("\n\r")
                    error("Deploy failed:<pre>"+ e.message+"</pre>")
                    return
                end
            end
            p "undeploy script ok"

            p "undeploy udo"
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
                    :schema=>"I027910_MASTER"
                }

                ActiveRecord::Base.establish_connection(ActiveRecord::Base::ConnectionSpecification.new(config, "odbc_connection"))

    #ActiveRecord::Base.connection.execute("INSERT INTO \"I027910_MASTER\".\"schema_migrations\" VALUES ('dd', '2014070620141747944')")
    #p "done !!"
                # ActiveRecord::Migrator.run(:down, "db/migrate/", version)   

                ActiveRecord::Migrator.migrate(appid, "#{repo_ws_path(appid)}/app/migrate", version.to_i)
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
            p "undeploy ok"



            # undeploy ui
            ui_root_dir = "#{app_root_dir}/app/ui_root"
            tenantid=1
            if FileTest::exists?(ui_root_dir) 
                dest = "#{$SETTINGS[:ui_root_dir]%[tenantid]}/#{appid}"
                p "uid dest path =#{dest}"
                begin
                    p "rm #{dest}"
                    FileUtils.rm_rf(dest)

                rescue Exception => e
                    p e.inspect
                    p e.backtrace[0..e.backtrace.size-1].join("\n\r")
                    error("Deploy failed:<pre>"+ e.message+"</pre>")
                    return
                end
            end
            new_id = ActiveRecord::Base.connection.select_value("SELECT  #{config[:schema]}.EXTENSIONAPPREGISTRY_SEQ.NEXTVAL from dummy")

            sql = "delete from #{config[:schema]}.EXTENSIONAPPREGISTRY where extensionid='#{appid}'"
            ActiveRecord::Base.connection.execute(sql)
            p "undeploy UI ok"      



            dev_server_b1_url = @user.dev_server_b1_url
            success("Deploy successfully", {:url=>"#{dev_server_b1_url}"})


        #    /opt/share/sfaattachment/
         #   \T1\rtspace\com.cid.oms\src\resources\UI-INF
        end   
    # open file
    def of
        appid = params[:appid]
        path = params[:fname]
        type = params[:type]
        repo = appid
        fi= fileInfoFromPath(path)
        fname = fi[:fname]
        
        # dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
        
        fname = "#{repo_ws_path(repo)}/app/#{fi[:relative_path]}"
        data = ""
        begin
            if FileTest::exists?(fname) 
                    open(fname, "r+") {|f|
                           data = f.read
                           
                       p "===>data(#{fname}):#{data}"
                            data = "" if data == nil
                                
                       }
                  
                   
            end
        rescue Exception=>e
             p e.inspect
             p e.backtrace[1..e.backtrace.size-1].join("\n\r")
             
        end
        
        if params[:r] == 'json'
            p "data:#{data}"
            if data.strip == ""
                data = {}
            else
                data = JSON.parse(data)
            end
        end
        success("ok", {:data=>data})
        return 
        
    end
    
    def updateJSonList(json, list_name, path, op_type ="add")
        p "updateJSonList1(#{list_name}): #{json}"
        bo_list = json[list_name]
        if bo_list == nil
            bo_list =[]
            json[list_name] = bo_list
        end
        if bo_list.include?(path) == false
            bo_list.push(path)
        else 
            if op_type == 'add'
                return [false, "Cannot add file #{path}, file already exists"]
            end
        end
        p "updateJSonList2: #{json}"
        
    end
    
    def update_to_appinfo(appid, fi, op_type="update")
        p "===>update app #{appid}, fname #{fi[:fname]}, cat #{fi[:cat1]}"
        fname = fi[:fname]
        path = fi[:path]
        cat = fi[:cat1]
        cat2 = fi[:cat2]
        json = load_appinfo(appid)
        p "cat=>#{cat}"
        if cat == "bo_root"
            updateJSonList(json, "bo_list", path, op_type)
        elsif cat=='extension'
            updateJSonList(json, "ext_list", path, op_type)
            
            
        elsif cat == "service_root"
            updateJSonList(json, "service_list", path, op_type)
            
        elsif cat == "ui_root" && cat2 != nil
            if cat2 == "ui_root_m"
                updateJSonList(json, "ui_mobile", path, op_type)
            elsif cat2== "ui_root_u"
                updateJSonList(json, "ui_universal", path, op_type)
            end
        end
        save_appinfo(appid, json.to_json)
        return [true, "ok"]
    end
    def load_appinfo(appid)
        fname = repo_ws_path(appid)+"/.appinfo"
        json = nil
        begin
            if FileTest::exists?(fname) 
                    data= nil  
                    open(fname, "r+") {|f|
                           data = f.read
                           
                       p "===>data(#{fname}):#{data}"
                             if data
                                 json = JSON.parse(data)
                                 # yield f, json if block_given?
                                 # p "data=#{data.inspect}"
                       
                             end 
                       }
                  
                   
            end
        rescue Exception=>e
             p e.inspect
             p e.backtrace[1..e.backtrace.size-1].join("\n\r")
             
        end
        
        if json == nil
            json ={
                "bo_list"=>[],
                "ext_list"=>[],
                "sevice_list"=>[],
                "ui_mobile"=>[],
                "ui_universal"=>[]
            }
        end
        return json
        
    end
    
    def load_app_struct(dir)
        base = File.basename(dir)
         json = {
             'name'=>base, 
             'v' =>[]
         }
         node = json['v']
         begin
             if FileTest::exists?(dir) 
                     Dir.foreach("#{dir}") do |item|
p "file1  #{item}"
                       next if item.start_with?(".")
                       fname = "#{dir}/#{item}"
                       if File.file?(fname)
                          p "file  #{fname}"
                          node.push(item)
                       elsif File.directory?(fname)
                           node.push(load_app_struct(fname))
                       end
                     end
             end
         rescue Exception=>e
              p e.inspect
              p e.backtrace[1..e.backtrace.size-1].join("\n\r")
              
         end
         return json
    end
    def load_appinfo2(appid)
        dir = repo_ws_path(appid)+"/app"
        node = load_app_struct(dir)
        return node
    end    
    def save_appinfo(appid, content)
         begin
                dir = repo_ws_path(appid)
                FileUtils.makedirs(dir)
                # logger.info("===========>#{dir}/#{id}<====")
                p "===>save to file #{dir}/.appinfo"
                p "===>content #{content}"
                aFile = File.new("#{dir}/.appinfo","w")
                aFile.puts content
                aFile.close
                relative_path = ".appinfo"
                
                Git2.add_and_commit(appid, @user.name, relative_path, "user change")
              rescue Exception=>e
                # logger.error e
                p e.inspect
              end
    end
    # tail log
    def tlog
        ln = params[:ln].to_i
        t = Time.now
        logfile = sprintf($SETTINGS[:console_log], t.year, t.month, t.day )
        p "==>logfile:#{logfile}"
        ar = []
         begin
                if FileTest::exists?(logfile)
                    p "grep -Fc \"\" #{logfile}"
                    line_number = `grep -Fc "" #{logfile}`.to_i
                    f=File.open(logfile,"r")  
                    t = nil      
                    
                    line_number = 0 if !line_number
                    
                    start_line = line_number-ln
                    start_line = 0 if start_line < 0
                        
                    p "start_line=#{start_line}, line_number=#{line_number}"
                    f.readlines[start_line..line_number].each do |line|
                        next if line == nil
                        l  = line.gsub("<", "&lt;").gsub(">", "&gt;") 
                        ar.push("#{l}<br/>")
                    end
                end
        rescue Exception=>e
            err(e)
            error(e.message)
            return
        end
        p "===>ar:#{ar.join('\n')}"
        # c = Base64.encode64(ar.join("\n"))
        c = CGI.escape(ar.join("\n"))
        success("OK",{
            :start_line =>start_line,
            :c=>c
            
        })
        return
    end
    # retrieve log
    def rlog
        # logfile = params[:logfile]
        startline = params[:sl]
        startline = 0 if startline == nil
        startline = startline.to_i
        startline += 1
        line_num = params[:ln]
        if line_num == nil
            line_num = 100 
        else
            line_num = line_num.to_i
        end
        max_line = 500
        t = Time.now
        p $SETTINGS[:console_log]
        logfile = sprintf($SETTINGS[:console_log], t.year, t.month, t.day )
        p "==>logfile:#{logfile}"
        ar = []
         begin
                if FileTest::exists?(logfile)
                    line_number = `grep -Fc "" #{logfile}`.to_i
                    p "log line number #{line_number}"
                    if line_number > startline
                        
                        f=File.open(logfile,"r")  
                        t = nil      
                        p "start line #{startline}, line_num  #{line_num}"
                        if line_num < 0
                            f.readlines[startline+line_num..startline].each do |line| 
                                  next if line == nil
                                    l  = line.gsub("<", "&lt;").gsub(">", "&gt;") 
                                    ar.push("#{l}<br/>")
                            end
                        else
                            f.readlines[startline..startline+line_num].each do |line| 
                                  next if line == nil
                                    l  = line.gsub("<", "&lt;").gsub(">", "&gt;") 
                                    ar.push("#{l}<br/>")
                            end
                        end
                    
                    end
                end
        rescue Exception=>e
            err(e)
            
            render :text=>""
            return
        end
        
        # if line_num < 0
            # ar.reverse!
        # end
        p "log:#{ar.join("\n")}"
        render :text=>ar.join("\n")
        return
    end

    def submit
        redirect_to "#{$SETTINGS[:submit_url]}?appid=#{params[:appid]}"
    end
    
    def commit
        appid = params[:appid]
        path = params[:fname]
        type = params[:type]
        msg = params[:m]
        msg = "user change" if msg == nil || msg == ""
        
        fi= fileInfoFromPath(path)
        fname = fi[:fname]
        
        if type == 'code'
            
        elsif type == 'bo'
            
        end
        repo = appid
        begin
            
            dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
            FileUtils.makedirs(dir)
            
            file_path = "#{dir}/#{fname}"

            
          
            relative_path = "app/#{fi[:relative_path]}"

             Git2.add_and_commit(repo, @user.name, relative_path, msg)
          rescue Exception=>e
            # logger.error e
            p "exception:"+e.inspect
            p "call stack:"+e.backtrace[1..e.backtrace.size-1].join("\n\r")
            
            if /no changes/=~e.message  ||  /nothing to commit/=~e.message
                error("No Changes need to commit")
            elsif /fatal: cannot do a partial commit during a merge/ =~ e.git_msg
                error("You have files during a merge, pleas commit them firstly")
            else
                error(e.inspect+e.backtrace[1..e.backtrace.size-1].join("\n\r"))
            end
            return
          end


          success()
    end
    
    def diff
        appid = params[:appid]
        path = params[:f]
        
        if path && path != ""
            fi= fileInfoFromPath(path)
            relative_path = "app/#{fi[:relative_path]}"
        else
            relative_path = ""
        end
        o = Git2.diff(appid, @user.name, relative_path)
        p "diff result:"+o
        if (o.lines.count>=5)
        lines_Removed = 5
            # o = o.gsub(Regexp.new("([^\n]*\n){%s}" % lines_Removed), '') 
            # o = o.gsub(/^(?:[^\n]*\n){3}/, "")
            o = o.to_a[4..-1].join
        end
        render :text=>o
        
    end
    
    def pull
        appid = params[:appid]
        
        begin
            o = Git2.pull(appid, @user.name)
            p "pull result:"+o
        rescue Exception=>e
            # e.git_msg.scan(/CONFLICT (content): Merge conflict in ([^\n]*)\n/){|m|
            #     p m.inspect
            # 
            # }
            p "git_msg =#{e.git_msg}"
            o = e.git_msg + "\n"+Git2.status(appid, @user.name)
            
            error("Cannot pull", {:data=>o})
            
            return
        end
        
        success("Pull successfully", {:data=>o})
        
        # render :text=>o
        
    end
    def push
        appid = params[:appid]

        begin
            o = Git2.push(appid, @user.name)
            p "push result:"+o
        rescue Exception=>e
            # e.git_msg.scan(/CONFLICT (content): Merge conflict in ([^\n]*)\n/){|m|
            #     p m.inspect
            # 
            # }
            p "git_msg =#{e.git_msg}"
            o = e.git_msg + "\n"+Git2.status(appid, @user.name)
            
            error("Cannot push", {:data=>o})
            
            return
        end
  
        
        success("Push successfully", {:data=>o})
        
        # render :text=>o        
    end
    def history
        appid = params[:appid]

        begin
            o = Git2.log(appid, @user.name, nil, "--all")
            p "git-log result:"+o
        rescue Exception=>e
            # e.git_msg.scan(/CONFLICT (content): Merge conflict in ([^\n]*)\n/){|m|
            #     p m.inspect
            # 
            # }
            p "git_msg =#{e.git_msg}"
            o = e.git_msg + "\n"+Git2.status(appid, @user.name)
            
            # error("Cannot push", {:data=>o})
            
            # return
        end
  
        
        # success("Push successfully", {:data=>o})
        
        render :text=>o        
    end
    # genereate bo migration script
    def gbm
        p "===>gbm"
        appid = params[:appid]
        path = params[:fname]
    
        repo = appid
        fi= fileInfoFromPath(path)
        fname = fi[:fname]
        
        # dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
        
        fpath = "#{repo_ws_path(repo)}/app/#{fi[:relative_path]}"
        data = ""
        begin
            if FileTest::exists?(fpath) 
                    open(fpath, "r+") {|f|
                           data = f.read
                           
                       p "===>data(#{fpath}):#{data}"
                            data = "" if data == nil
                                
                       }
                  
                   
            end
        rescue Exception=>e
             p e.inspect
             p e.backtrace[1..e.backtrace.size-1].join("\n\r")
             error("Cannot read BO")
             return
             
        end
        begin
            FileUtils.mkdir_p("#{repo_ws_path(repo)}/app/migrate")
        rescue Exception=>e
             p e.inspect
             p e.backtrace[1..e.backtrace.size-1].join("\n\r")
             error("Cannot create path for migrate")
             return
        end
        js = JSON.parse(data)
        p js.inspect
        script = ""
        m_fnames = []
        js["data"].each{|o|
            o["version"] = 0 if !o["version"]
           if o["name"] == nil || o["name"].strip == ""
               error("BO must have a name")
               return
           end
           
            script = generate_migration(appid, o)
            o["version"] += 1
            t = Time.now
            time = t.strftime("%Y%m%d%H%M%S")+t.usec.to_s
            m_fname = "#{repo_ws_path(repo)}/app/migrate/#{time}_#{o['name']}.rb"
              p "output to #{m_fname}"
             begin
                  
                  aFile = File.new(m_fname, "w+")
                  aFile.puts script
                  aFile.close
                  m_fnames << File.basename(m_fname)
              rescue Exception=>e
                  p e
              end
        }
        
        # save to file because version changed
        aFile = File.new(fpath,"w")
         aFile.puts js.to_json
         aFile.close

        # p "fname=#{fname}"
        # ar  = fname.split(".")
        # mi_name = ar[0..ar.size-2].join(".")
        # t = Time.now
        # time = t.strftime("%Y%m%d%H%M%S")+t.usec.to_s
        # m_fname = "#{repo_ws_path(repo)}/app/migrate/#{time}_#{mi_name}.rb"
        #   p "output to #{m_fname}"
        #  begin
        #       FileUtils.mkdir_p("#{repo_ws_path(repo)}/app/migrate")
        #       aFile = File.new(m_fname, "w+")
        #       aFile.puts script
        #       aFile.close
        #   rescue Exception=>e
        #       p e
        #   end
        success("ok", {:data=>script, :migrate=>m_fnames})
        return
    end
    def all_migrations(appid, udo_name = "")
           if !udo_name || udo_name==""
             exp_pattern = "[_a-z0-9]" 
             file_pattern = ""
            else
                exp_pattern = udo_name

             file_pattern = udo_name
           end
           begin
               dir = "#{repo_ws_path(appid)}/app/migrate"
               if FileTest::exists?(dir) 
                   
                   files = Dir["#{dir}/*#{file_pattern}.rb"] 
                   migrations = files.inject([]) do |klasses, file|
                       reg = Regexp.new("([0-9]+)_(#{exp_pattern}).rb")
                       p "([0-9]+)_(#{exp_pattern}).rb" 
                       version, name = file.scan(reg).first
                       p "#{name} #{version}"
                       raise Exception.new("IllegalMigrationNameError #{file}") unless version
                       version = version.to_i

                       # if klasses.detect { |m| m[:version] == version }
                       #     raise Exception.new("DuplicateMigrationVersionError #{version}")
                       # end

                       # if klasses.detect { |m| m[:name] == name.camelize }
                       #     raise Exception.new("DuplicateMigrationNameError #{name.camelize}")
                       # end
                       if klasses.detect { |m| m[:version] == version &&  m[:name] == name.camelize}
                           raise Exception.new("DuplicateMigrationVersionError #{version}")
                       end
                       klasses.push({
                           :name=>name.camelize,
                           :cls =>name,
                           :version=>version,
                           :filename=>file
                       })

                   end
                   migrations = migrations.sort_by{|h| h[:version]}

               
               end # if FileTest::exists?(dir) 
               p "deploy udo success"

           rescue Exception => e
               p e.inspect
               p e.backtrace[1..e.backtrace.size-1].join("\n\r")
               # error("Deploy failed:<pre>"+ e.message+"</pre>")
               return
           end
           return migrations
    end
    def find_previous_migrate(appid, udo)
        begin
           migrations = all_migrations(appid, udo['name'])
            p "migrations size #{migrations.size}"
        migrations.reverse!
            migrations.each{|m|
                p "migrate '#{m[:filename]}'"
                }
            migrations.each{|m|
            begin
                p "load '#{m[:filename]}'"
                
                eval "load '#{m[:filename]}'"
                p "#{m[:name]}.new()"
                obj = eval "#{m[:name]}.new()"
                
            rescue Exception=>e
                p e.inspect
                p e.backtrace[1..e.backtrace.size-1].join("\n\r")                    
            end
            p "udo mig version:#{obj.class.version}" if obj
            p "udo version #{udo['version'].to_i}"
            if obj && obj.class.version < udo['version'].to_i
                return obj
            end
            }
              
            
        rescue Exception => e
            p e.inspect
            p e.backtrace[1..e.backtrace.size-1].join("\n\r")
            # error("Deploy failed:<pre>"+ e.message+"</pre>")
            return nil
        end
        return nil
    end
    def generate_migration(appid, udo)
        # find previous version of udo
        old_udo = find_previous_migrate(appid, udo)
        script = ""
        if old_udo  # if found
            # find difference
            p "find old udo version #{old_udo.class.version}"
            old_udo_json = JSON.parse(old_udo.udo_json)
            # p old_udo_json.inspect
            script += generate_migration_diff(udo, old_udo_json)
        else
        # if not found, generate from nothing
            script += generate_migration_source(udo)
        end
        return script
    end
    def generate_migration_source(udo)
        p "generate_migration_source"
        sf = ""
        _sf = ""
        udo["fields"].each{|f|
            # sf << "\t\tt.#{f["type"]} :#{f["name"]} \n"
            s = <<ENDD
            {
                :name=>"#{f['name']}",
                :type=>"#{f['type']}"
            },
ENDD
        _sf += s
          
        }
        sf = "[
#{_sf}
        ]"
        
        sf2 = ""
        udo["fields"].each{|f|
            sf2 += "\t\t# u.add_field :name=>#{f['name']} :type #{f['type']}\n" 
        }
        
        
        sf3 = ""
        udo["fields"].each{|f|

            sf3 += "\t\t t.#{f['type']} :#{f['name']}" 
            p "112default value #{f['default_value']}"
            
            if f['default_value']
                p "111default value #{f['default_value']}"
             if ["string"].include?(f['type'].downcase) || f['default_value'].downcase=="null"
                    dfv = "\"#{f['default_value']}\""
             else
                    dfv = "#{f['default_value']}"
             end
             sf3 += ", :default=>#{dfv}"
            end
            
            if f['unique'] == "true" || f['unique'] == "true"
              sf3 += ", :isUnique=>1"
             end
             
             if f['size'] 
               sf3 += ", :size=>#{f['size'] }"
              end             
            sf3 +="\n"
        
        }    
        # t = Time.now
        #    time = t.strftime("%Y%m%d%H%M%S")+t.usec.to_s
        class_name = udo["name"].camelize
        version = udo["version"]
        template = <<TEMPLATE_END
require 'bomigration.rb'
class #{class_name} < Bomigration
  @@version=#{version}
  @@udo_json=<<JSONEND
  #{udo.to_json}
JSONEND
  cattr_accessor :udo_json
  
  def self.up
    create_udo :#{udo["name"]}, :desc=>\"#{udo["desc"]}\",:other=>\"xxx\" do |t| 
#{sf3}\tend
    
  end

  def self.down
    drop_udo :#{udo["name"]}
  end
end

TEMPLATE_END
        return template
      
    end
    
    def rm
        appid = params[:appid]
        path = params[:fname]
        type = params[:type]
        content = params[:content]
        isnew = params[:isnew]
        
        p "content:#{content}"
        fi= fileInfoFromPath(path)
        fname = fi[:fname]
        
        if type == 'code'
            
        elsif type == 'bo'
            
        end
        repo = appid
        begin
            
            dir = repo_ws_path(repo)+"/app/#{fi[:relative_dir]}"
       
            p "===>remove file #{dir}/#{fname}"
            
            file_path = "#{dir}/#{fname}"
            FileUtils.rm(file_path)
            
            relative_path = "app/#{fi[:relative_path]}"
            begin
                Git2.commit(repo, @user.name, relative_path)
            rescue Exception=>e
                # logger.error e
                p e.inspect
                p e.backtrace[1..e.backtrace.size-1].join("\n\r")
            end
          rescue Exception=>e
            # logger.error e
            p e.inspect
            p e.backtrace[1..e.backtrace.size-1].join("\n\r")
            error("Fail to remove file "+e.inspect)
            return
          end
     
          success()       
    end
    
    def generate_migration_diff(udo, old_udo)
        diffs = []
        compared = []
       
        udo["fields"].each{|f|
            name = f["name"]
            p name
            compared.push(name)
            p old_udo["fields"].inspect
            if old_udo['fields'].detect{|ff| 
                p "ff=#{ff.inspect}"
                ff['name'] == name }
                
            else
                diffs.push({
                    :type=>"add",
                    :name=>name
                })
            end
        }
        script = ""
        script_down = ""
        
        diffs.each{|d|
            field = udo["fields"].detect{|f|f['name'] == d[:name]}
            script << "add_udf \"#{udo['name']}\", \"#{d[:name]}\", :#{field['type']}"
            script_down << "delete_udf \"#{udo['name']}\", \"#{d[:name]}\""
        }
        class_name = udo['name'].camelize
         version = udo["version"]
        template = <<TEMPLATE_END
require 'bomigration.rb'
class #{class_name} < Bomigration
  @@version=#{version}
  @@udo_json=<<JSONEND
  #{udo.to_json}
JSONEND
  cattr_accessor :udo_json

  def self.up
    #{script}
  end

  def self.down
    #{script_down}
  end
end

TEMPLATE_END
        return template

    end
end
