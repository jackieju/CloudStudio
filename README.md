# CloudStudio Online IDE
An Online IDE(development environment)/cloud Studio support git, code editor, visual design, oauth2, watching server log, deployment, db migration, etc... 

This is based on ruby 1.8.7 on rails 2.3.5 (But it's easy move on other version of ror)

Install & run
===
git clone https://github.com/jackieju/CloudStudio.git cloudstudio
cd cloudstudio
script/server

git integration
===
Set $SETTINGS in config/environments/development.rb
e.g.
	$SETTINGS={
        :git_server=>"10.58.9.209",
        :repo_root=>"/var/mygithub",
        :workspace_root=>"./tmp/workspaces",
	}

Watch console log
==
Set $SETTINGS[:console_log] in config/environments/development.rb
e.g.
$SETTINGS[:console_log] ="/Users/i027910/Desktop/SAP/src/oce/log/development.log"


oauth2
===
Set $SETTINGS in config/environments/development.rb
e.g.
	$SETTINGS={
		:oauth_server_url_authorize=>"https://10.58.118.63:8444/sld/oauth2/authorize",
		:oauth_server_url_token=>"https://10.58.118.63:8444/sld/oauth2/token",
		:oauth_client_secret=>"vkNfMXd0zN-zQ3-l3vFnokRBoqqF",
		:oauth_client_id=>"4874805429075418-yFNLByquAI63nUMkOxdZUoehmI0c85Um",
	}

