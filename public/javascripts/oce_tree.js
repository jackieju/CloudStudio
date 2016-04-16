/// =====================
// = Tree manipulation =
// =====================

var $tree = null;
var g_root_node = null;
var g_selected_node = null;
//////

// var g_bo_root = data[0];
// var g_extion_root = data[1];

/*var root = [
	{
		label: 'B1_project',
		type: 'app',
		children:data
	}
];	
*/


/*
function init_tree(data_root){
	// alert(inspect(data_root.bo_list));
	
	// alert(inspect(data_root));
	if (data_root != null){
		
		if (data_root.bo_list != null && data_root.bo_list.lenght>0)
		var i = 0;
		for (var i = 0;i <  data_root.bo_list.length; i++){
			item = data_root.bo_list[i];
			item=item.substr(item.lastIndexOf('/')+1);
			// alert("bo:"+inspect(item));
			// alert("root:" + inspect(root.children));
			root[0].children[0].children.push({
				label:item,
				type:"bo"
			});
		}
		if (data_root.ext_list != null)
		for (var i = 0;i <  data_root.ext_list.length; i++){
			item = data_root.ext_list[i];
			
			// alert("code:"+inspect(item));
			item=item.substr(item.lastIndexOf('/')+1);
			
			root[0].children[1].children.push({
				label:item,
				type:"code"
			});
		}
		if (data_root.service_list != null)
				for (var i = 0;i <  data_root.service_list.length; i++){
						item = data_root.service_list[i];
						// alert("code:"+inspect(item));
						item=item.substr(item.lastIndexOf('/')+1);
						
						root[0].children[2].children.push({
							label:item,
							type:"code"
						});
					}
			if (data_root.ui_universal != null)
				for (var i = 0;i <  data_root.ui_universal.length; i++){
					item = data_root.ui_universal[i];
					// alert("code:"+inspect(item));
					item=item.substr(item.lastIndexOf('/')+1);
					// alert(root[0].children[3]);
					root[0].children[3].children[0].children.push({
												label:item,
												type:"code"
											});
				}
			if (data_root.ui_mobile != null)
			for (var i = 0;i <  data_root.ui_mobile.length; i++){
				item = data_root.ui_mobile[i];
				// alert("code:"+inspect(item));
				item=item.substr(item.lastIndexOf('/')+1);
				
				root[0].children[3].children[1].children.push({
					label:item,
					type:"code"
				});
			}
	}
	// alert();
	
	
	 $tree = $('#tree').tree({
	    data: root,
	 	dragAndDrop: true,
		  onCreateLi: function(node, $li) {
		        // Add 'icon' span before title
				icon = "/images/File-32.png";
				style= "vertical-align:bottom;height:25px;border:0px solid red;";
				if (node.type == 'folder')
					icon = "/images/Folder-128.png";
				if (node.type == 'bo_root')
					icon = "/images/Folder-128.png";
				if (node.type == 'app')
					icon = "/images/apps-256.png";
				if (node.type == "extension")
					icon = "/images/Plugins-48.png";
				if (node.type == "ui_root_u" )
					icon = "/images/Apps-48.png";
				if (node.type == "ui_root" )
					icon = "/images/Apps-48.png";	
				if (node.type == "ui_root_m" )
					icon = "/images/mobile.png";
				if (node.type == "service_root")
					icon = "/images/service.png";
				if (node.children == null  || node.children.length == 0)
					style= "vertical-align:bottom;height:25px;border:0px solid red;margin-left:20px;";
		        $li.find('.jqtree-title').before('<img style="'+style+'" src="'+icon+'" />');
				
		    }
	    });
	 g_root_node = $tree.tree("getTree").children[0];
	// alert(g_root_node.children[0]);
		// bind 'tree.click' event
		$tree.bind(
		    'tree.click',
		    function(event) {
				
				// alert(inspect(event));
		        // The clicked node is 'event.node'
		       	var node = event.node;
				if (node != g_selected_node){
					if (g_selected_node && g_selected_node.isNew == 'true' ){
						popup("You haven't save this file.");
						return false;
					}
					else
					{
						g_selected_node = node;
						if (node.type == 'code')
							open_file(node);
						else if (node.type == 'bo')
							open_bo(node);
					}
				}
		    }
		);
		$tree.bind(
		    'tree.dblclick',
		    function(event) {
		        // event.node is the clicked node
		        // console.log(event.node);
		        var node = event.node;
				g_editing_node = node;
		        if (node.type == 'code')
					pre_rename_node(event)
				else if (node.type == 'bo')
					pre_rename_node(event)
				else 
				$tree.tree(
					'openNode',
					event.node,
					true);
		    }
		);
		$tree.bind(
		    'tree.move',
		    function(event) {
		        // console.log('moved_node', event.move_info.moved_node);
		        // 		        console.log('target_node', event.move_info.target_node);
		        // 		        console.log('position', event.move_info.position);
		        // 		        console.log('previous_parent', event.move_info.previous_parent);
				if (event.move_info.target_node == g_root_node)
					return false;
				if ( (event.move_info.moved_node.type == 'code' && event.move_info.target_node.type=='bo_root') 
				||  (event.move_info.moved_node.type == 'bo' && event.move_info.target_node.type=='extension'))
					return false;
				return true;
		    }
		);
}*/

var g_nodetypes = [{
	type:"app",
	name:"app",
	icon:"/images/Apps-256.png",
},{
	type:"folder",
	name:"folder",
	icon:"/images/Folder-128.png",
	pos:null
}];
g_nodetypes.push({
	type:"dataelement",
	name:"dataelement",
	ext:"de",
	isLeaf:true,
	icon:"",
	open_method:function(node){ return open_de(node);},
	pos:null
});

function get_type(type){
	
	for (i = 0; i< g_nodetypes.length; i++){
		t = g_nodetypes[i];
		
		console.log(t.type);	
		if (t.type == type)
			return t;
	}
	return null;
}
function find_type_by_ext(ext){
	for (i = 0; i< g_nodetypes.length; i++){
		t = g_nodetypes[i];
		
		if (t.ext == ext)
			return t;
	}
	return null;
}
function get_type_by_filename(fname){
//	alert(fname);
	ext = get_file_ext(fname).toLowerCase();
//	alert("ext "+ext);
	t = find_type_by_ext(ext);
	return t;
}
function add_file_to_tree(node, parent, tree_node){
	
	// alert("add "+ inspect(node));
	// alert(typeof(node));
	// if (typeof(node) != 'string'){
	if (typeof(node) == 'object'){ // node is a folder
		// type = "folder";
		// if (node.name == 'bo_root'){
		// 			type = 'bo_root';
		// 		}
		label = node.name;
		// alert(node.name);
		
		// determin target node where to add this node
		if (label == 'bo_root'){
			label = "Business Objects";
			// alert(inspect(root[0].children[0]));
			tnode = root[0].children[0];
		}else if (label == 'extension'){
			type = "extension";
			tnode = root[0].children[1];
		}else if (label == 'service_root'){
			type = "code";
			tnode = root[0].children[2];
		}else if (label == 'ui_root'){
			type = "code";
			tnode = root[0].children[3];
		}
		else if (label == 'ui_root_u'){
			type = "code";
			tnode = root[0].children[3].children[0];
		}else if (label == 'ui_root_m'){
			type = "code";
			tnode = root[0].children[3].children[1];
		}else if (label == 'migrate'){
			type = "code";
			tnode = root[0].children[4];
		}else if (label == 'lib'){
			type = "code";
			tnode = root[0].children[5];
		}else if (label == 'bosource'){
			type = "code";
			tnode = root[0].children[5].children[0];
		}				
		else{
			tnode = {
				label:label,
				type:"folder",
				children:[]
			};
			tree_node.children.push(tnode);
		}
	
		var list = node.v;
			// alert("length:"+list.length);
		for (var k =0; k< list.length; k++){
			// alert(k+"th:"+ list[k]);
			add_file_to_tree(list[k], node, tnode);
			// alert(k +"th in "+list.length+" added" );
		}
	}else{
		// alert(get_file_ext(node).toLowerCase());
		//if (get_file_ext(node).toLowerCase() == 'bo')
		//	type = "bo";
		ext = get_file_ext(node).toLowerCase();
		t = find_type_by_ext(ext);
		if (t)
			type = t.type;
		else
			type = "code";
		
		
			// alert(type);
		tree_node.children.push({
			label:node,
			type:type,
		});
	}
		// alert("added "+ inspect(node));
}
// init tree from fs structure
function init_tree2(data_root, info, init_structure){
	// alert(inspect(data_root.bo_list));

	// alert(inspect(data_root));
	data = init_structure;
	if (data == null)
		data = [];
	root = [
		{
			//label: info.name+"("+info.appid+")",
			label: "anyting",
			type: 'app',
			children:data
		}
	];
		
	if (data_root != null){
		// data_root,root[0].children= [];
		for (var i = 0;i <  data_root.length; i++){
			item = data_root[i];
			add_file_to_tree(item, data_root, root[0]);
			// alert(i);
			
		}
	
	}
	

	
	 $tree = $('#tree').tree({
	    data: root,
	 	dragAndDrop: true,
		  onCreateLi: function(node, $li) {
		        // Add 'icon' span before title
				icon = "/images/File-32.png";
				style= "vertical-align:bottom;height:25px;border:0px solid red;";
				/*if (node.type == 'folder')
					icon = "/images/Folder-128.png";
				if (node.type == 'bo_root')
					icon = "/images/Folder-128.png";
				if (node.type == 'app')
					icon = "/images/Apps-256.png";
				if (node.type == "extension")
					icon = "/images/Plugins-48.png";
				if (node.type == "ui_root_u" )
					icon = "/images/Apps-48.png";
				if (node.type == "ui_root" )
					icon = "/images/Apps-48.png";	
				if (node.type == "ui_root_m" )
					icon = "/images/mobile.png";
				if (node.type == "service_root")
					icon = "/images/service.png";*/
				if (node.type == 'app')
					icon = "/images/Apps-256.png";
				else{
					t = get_type(node.type);
				
					if (t)
						icon = t.icon;
				}
				if (icon == null || icon == "")
					icon = "/images/File-32.png";
				if (node.children == null  || node.children.length == 0)
					style= "vertical-align:bottom;height:25px;border:0px solid red;margin-left:20px;";
	
		        $li.find('.jqtree-title').before('<img style="'+style+'" src="'+icon+'" />');
				if (node.type == 'app'){
					//app_title = "<span style=\"font-size:14pt;font-weight:600;\">"+info.name+"</span>("+info.appid+")";
					app_title = "<span style=\"font-size:14pt;font-weight:600;\">"+info.name+"</span>";
					$li.find('.jqtree-title').html(app_title);
				}
					
					// if (node.type != "code" && node.type != "file"){
						// alert($li);
						// 							$li.html5Uploader({
						// 						        name: node.name,
						// 						        postUrl: "/app/upload"    
						// 						    });
						// 						alert("upload");
					// }    
		}
	    });
	 g_root_node = $tree.tree("getTree").children[0];
	// alert(inspect(info));
		// alert(inspect(g_root_node));
	// alert(g_root_node.children[0]);
		// bind 'tree.click' event
		$tree.bind(
		    'tree.click',
		    function(event) {
				
				// alert(inspect(event));
		        // The clicked node is 'event.node'
		       	var node = event.node;
				if ( node !=g_selected_node ){
					if (g_selected_node && g_selected_node.isNew == 'true' && g_selected_node.type != "folder"){
						popup("You haven't save this file.");
						return false;
					}
					else
					{
						g_selected_node = node;
					   //if (node.type == 'code')
					   //	open_file(node);
					   //else if (node.type == 'bo')
					   //	open_bo(node);
						
						if (g_selected_node != g_root_node){
						t = get_type(node.type);
						//alert(node.type);
						
						if (t && t.isLeaf == false)
						;
						else if (t){
							
							t.open_method(node);
						}else
							open_file(node);
						}
					}
				}
		    }
		);
		$tree.bind(
		    'tree.dblclick',
		    function(event) {
		        // event.node is the clicked node
		        // console.log(event.node);
		        var node = event.node;
				g_editing_node = node;
		        if (node.type == 'code' || node.type == 'folder')
					pre_rename_node(event);
				else if (node.type == 'bo')
					pre_rename_node(event);
				else 
				$tree.tree(
					'openNode',
					event.node,
					true);
		    }
		);
		$tree.bind(
		    'tree.move',
		    function(event) {
		        // console.log('moved_node', event.move_info.moved_node);
		        // 		        console.log('target_node', event.move_info.target_node);
		        // 		        console.log('position', event.move_info.position);
		        // 		        console.log('previous_parent', event.move_info.previous_parent);
				if (event.move_info.target_node == g_root_node)
					return false;
				if ( (event.move_info.moved_node.type == 'code' && event.move_info.target_node.type=='bo_root') 
				||  (event.move_info.moved_node.type == 'bo' && event.move_info.target_node.type=='extension'))
					return false;
				return true;
		    }
		);
}

function rename_file(node, name){
	fname = getNodePath(node);
	
		$.ajax({
			type: "post",
			url: "/app/ren?t="+ new Date().getTime(),
			dataType: 'json',

			data: {
				appid:g_appid,
				fname:fname,
				name: name,
				type:node.type
				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			}, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
				}else{
					newtype = g_editing_node.type;
					t = get_type_by_filename(name);
					if (t)
						newtype = t.type;
					//alert("new "+newtype);
					va = {
						//type:g_editing_node.type,
						type: newtype,
						isNew:g_editing_node.isNew,
						label:name
						};

					$tree.tree('updateNode', g_editing_node, va);
					$("#edit_box").css("display", "none");
					$("#edit_value").val("");
					g_editing_node = null;
					popup('Rename successfully');

				}

			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
		// alert(content);

		showWaiting(true);	
}


function pre_rename_node(event){
	var node = event.node;
	// alert(node.name);
       $("#edit_box").css("display", "block");
	// alert(inspect(event.click_event));
	t = $(event.click_event.target);
	tt = $(event.target);
	// alert(tt.offset().left);
	// alert(inspect(event.click_event.target));
	// alert(t.position().left);
	// alert(event.click_event.target.offsetLeft);
	// alert(t.width());
	$("#edit_box").css("left", t.offset().left);
	$("#edit_box").css("top", t.offset().top);
	// $("#edit_box").css("width", t.width());
	tw = t.width();
	if (tw<50)
		tw=50;
		// alert(tw);
	$("#edit_value").width(tw);
	$("#edit_value").val(node.name);
	
	// $("#edit_box").top(event.click_event.clientY);
	
}


$("#edit_value").keydown(function(event){
	if (g_editing_node == null){
		$("#edit_box").css("display", "none");
		$("#edit_value").val("");
	}else{
		// alert(event.keyCode);
		if (event.keyCode==27){
				$("#edit_box").css("display", "none");

				$("#edit_value").val("");
				g_editing_node = null;
		}
		else if (event.keyCode==13){
			// alert("keydown");
			var v = $("#edit_value").val();
			// alert("v="+v);
		
			// alert(g_selected_node.name);
			// alert($tree[0]);
			if (g_editing_node.isNew == 'true'){
				va = {
					type:g_editing_node.type,
					isNew:g_editing_node.isNew,
					label:v
					};
		
				$tree.tree('updateNode', g_editing_node, va);
				$("#edit_box").css("display", "none");
			
		
				$("#edit_value").val("");
				g_editing_node = null;
			}else{
				rename_file(g_editing_node, v);
				
			}
			
			// alert(v);
		};
	}; // 	if (g_editing_node == null) else {
});

	// find node by name (Not recursively)
function find_node_by_name(node, name){
	// alert(node.children.length);
	for (var i = 0; i< node.children.length; i++){
		// alert(node.children[i].name);
		if (node.children[i].name == name)
			return node.children[i];
	}
	return null;
}
// you must clone your array before call this function
// var exc = [].concat(children);
function get_new_name(excl, name, ext_count){
	// get filename and file ext
	var prefix = name;
	var file_ext = "";
	var i = name.lastIndexOf(".");
	if (i>=0){
		prefix = name.substr(0, i);
		file_ext = name.substr(i, name.length);
	}
	// alert("ext_count="+ext_count+", prefix="+prefix+", ext="+file_ext);
	if (ext_count != 0)
		_name = prefix+ext_count.toString()+file_ext;
	else
		_name = name;
	// alert("test name "+_name);
	// alert("array:"+inspect(excl));
	// alert(children.length);
	for (var k = 0; k< excl.length; k++){
		// alert(i+":"+inspect(exc[i]));
		if (excl[k] == null)
			continue;
		// alert(inspect(exc[i]));
		if (_name == excl[k].name){
			// excl[i] = null;
			ext_count += 1;
			// _name = prefix+ext_count.toString()+file_ext;
			get_new_name(excl, name, ext_count);
		}
	}
	return _name;
}

// check duplciated name
function get_new_node_name(parent_node, name){

	// // get filename and file ext
	// var prefix = name;
	// var file_ext = null;
	// i = name.lastIndexOf(".");
	// if (i>=0){
	// 	prefix = name.substr(0, i);
	// 	file_ext = name.substr(i, name.length);
	// }

	// alert(prefix+","+file_ext);
	var excl = [].concat(parent_node.children);
	new_name =  get_new_name(excl, name, 0);
	return new_name;
}

function pre_add_node(){
	$("#type_list").css("display", "block");
	var pos = $("#add_node_btn").offset();
	var m_pos = $("#main").offset();
	var x = pos.left - m_pos.left;
	// alert($("#btn_select_theme").height());
	var y = pos.top - m_pos.top - $("#type_list").height();
	// alert(inspect(m_pos));
	// alert($("#btn_select_theme").offset().left);
	$("#type_list").css("left", x);
	$("#type_list").css("top", y-50);
	//e.stopPropagation();	
}
function add_node(type){
	 //alert(g_selected_node.type);
	if (g_selected_node == null)
		return;
	/*if (g_selected_node == g_root_node){
		newname = get_new_node_name(g_selected_node, "unnamed_folder");
		$('#tree').tree(
		    'appendNode',
		    {
		        label: newname,
		        type: 'folder',
				isNew: 'true'
		    },
		    g_selected_node
		);
	}
	else */if (g_selected_node.type == 'bo_root' || g_selected_node.parent.type == 'bo_root'){

		// g_bo_root.children.push({
		// 			label: 'New File',
		// 			type: 'bo', 
		// 		})


		if (g_selected_node.type=='bo_root'){
			// json = $('#tree').tree('toJson');
		//	alert(json);
			newname = get_new_node_name(g_selected_node, "NewBO.bo");
			$('#tree').tree(
			    'appendNode',
			    {
			        label: newname,
			        type: 'bo',
					isNew: 'true'
			    },
			    g_selected_node
			);

		}
		else {
			newname = get_new_node_name(g_selected_node.parent, "NewBO.bo");
			$('#tree').tree(
			    'addNodeAfter',
			    {
			        label: newname,
			        type:'bo',
					isNew: 'true'
			    },
			    g_selected_node
			);
		}
	}
	// alert(g_selected_node.type);
	else 	{ // if (g_selected_node.type == 'bo_root' || g_selected_node == 'bo')
		
		if (g_selected_node.hasChildren()){
			parent_node = g_selected_node;
		}else
		parent_node = g_selected_node.parent;
	
		if (type && get_type(type)){
			alert(type);
			tt = get_type(type);
			node_type = tt.type;
			newname = get_new_node_name(parent_node, "Untitled."+tt.ext);
		}else{
			newname = get_new_node_name(parent_node, "Untitled");
			node_type= "code";
		}
		newnode = {
	        label: newname,
	        type:node_type,
			isNew: 'true'
	    };
		t = get_type(g_selected_node.type );
		
		if (t.isLeaf == true){
			// alert(inspect(parent_node));

			$('#tree').tree(
			    'addNodeAfter',
			    newnode,
			    g_selected_node
			);
		}else /*	if (g_selected_node.type == 'extension' || g_selected_node.type == 'service_root' || /^ui_root/.match(g_selected_node.type)  )*/{

			$('#tree').tree(
			    'appendNode',
			    newnode,
			    g_selected_node
			);

		}

	} // if (g_selected_node.type == 'bo_root' || g_selected_node == 'bo') else



} // function add_node(){

function remove_node(){
	// alert(g_selected_node.type);
	to_rm = g_selected_node.name;
	if (g_selected_node == null )
		return;
	if (g_selected_node.type != "bo" && g_selected_node.type != "code")
		return;

	if (	g_selected_node.isNew == "true"){
		$tree.tree('removeNode', g_selected_node);
		g_selected_node = null;
	}else{
		fname = getNodePath(g_selected_node);
		$.ajax({
			type: "post",
			url: "/app/rm?t="+ new Date().getTime(),
			dataType: 'json',

			data: {
				appid:g_appid,
				fname:fname,

				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			}, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
				}else{
					$tree.tree('removeNode', g_selected_node);
					g_selected_node = null;

					appendToConsole("Delete "+to_rm+" successfully");

				}

			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
	}
} // function remove_node(){
