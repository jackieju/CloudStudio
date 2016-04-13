// ================
// = BO functions =
// ================	
	
	// $(".field").click(function(event){
	// 	show_field_prop();
	// });
	
	// store bo list of current editing bo view
	var g_bos = {data:[]};
	// the bo node of current bo view
	var g_current_bo_node = null;
	
	g_type_options = ["Boolean",
	    "Date",
	    "Time",
	    "DateTime",
	    "Integer",
	    "Long",
	    "Double",
	    "Decimal",
	    "Rate",
	    "Price",
	    "Sum",
	    "Quantity",
	    "Percent",
	    "Measure",
	    "Tax",
	    "String",
	    "Text",
	    "Link",
	    "Address",
	    "Phone",
	    "Binary",
	    "Memo",
	    "Email",
	    "Fax",
	    "ZipCode"];
	/*	function show_boprops(t){
			// alert(t.find("div.draggable_obj_name").html());
			a =  t.find("div.draggable_obj_name").html();
			// alert($("#props input#prop_name").html());
			// alert($("#props input#prop_v_name").length);
			name = ""+$.trim(a);
			// alert(name);
			$("#props input#boprop_v_name").val(name);
			$("#props input#boprop_v_type").val("BO");
			$("#prop_pad").css("display", "block");

			ps = t.find(".draggable_obj_prop");
			 // alert(ps.length);
			i = 0;
			for (;i<ps.length;i++){
				// alert($(ps[i]).attr("n"));
				item = $(ps[i]);
				n = item.attr("n");
				v = item.html();
				v = $.trim(v);
				// alert(v);
				// alert("#props #boprop_v_"+n);
				// alert($("#props #boprop_v_"+n).length);
				$("#boprop_v_"+n).val(v);

			}
			$("#field_prop_pad").css("display", "none");
			// alert(0);
		}
	*/
	function show_boprops(t){
			// alert(g_bo);
			bo = g_bo.prop('ref');
			$("#props input#boprop_v_name").val(bo.name);
			$("#props input#boprop_v_type").val("BO");
			$("#boprop_v_desc").val(bo.desc);
			// $("#props input#boprop_v_desc").val(bo.desc);
			// alert(bo.desc);
			
			
			$("#prop_pad").css("display", "block");
			// $("#boprop_v_name").html(bo.name);
			// $("#boprop_v_type").html(bo.type);
			
			$("#field_prop_pad").css("display", "none");
			// alert(0);
		}
	
	function add_bo_field(){
		newf = "<div class=\"field\" style=\"border-bottom:1px solid grey;margin-top:5px;\" i='"+g_bo.prop("ref").fields.length+"' onclick=\"show_field_prop(event);\";>\
			<span class='field_name' >unnamed</span> <span class='field_type' style=\"color:grey\">(String)</span>\
		<div class=bo_field_prop_list ></div>\
		</div>";

		btn = g_bo.find(".btn_add_bf");
		$(newf).insertBefore(btn);

		b = $("#balloon");
		btn = b.find(".btn_add_bf");
		newn = $(newf).insertBefore(btn);
		
		data = {
			name:"unamed",
			type:"string",
			length:1,
			default_value:"null",
			desc:""
		};
		g_bo.prop("ref").fields.push(data);
		newn.prop("ref", data);
		
		// alert(1);
	}
	
	g_selected_bo_field = null;
	function render_bo(bo){
		// alert(inspect(bo));
		str = "<div style='position:absolute;left:"+bo.x+"px; top: "+bo.y+"px;' id='"+bo.ui+"' class='draggable_obj ui-draggable bo'>\
			<img src='/images/block2.png' style='height:50px;'>\
			<div class='draggable_obj_name'>"
			+bo.name+
			"</div> \
			<div class='draggable_obj_prop' n='type'>"
			+bo.type+
			"</div>\
			<div class='draggable_obj_prop' n='desc'>"
				+bo.desc+
			"</div>\
		</div>";
		// alert(str);
		return str;
	}
	function prepare_bo(inserted, bo){
		// alert(inspect(inserted));
		// alert(inserted.outerHTML);
		inserted = inserted.find("div#"+bo.ui);
		// alert(inserted.length);
		// inserted.attr("inserted", "1");
		// inserted = $(inserted[inserted.length-1]);
		// alert(inserted[0].outerHTML);
		inserted.draggable({containment: "parent" });	
		// inserted.css('left', bo.x);
		// 	inserted.css('top', bo.x);
		
		inserted.prop("ref", bo);
		// alert(inspect(inserted.prop("ref")));
		// alert($(inserted[inserted.length-1]).attr("id"));
		// alert(inserted.html());
		inserted.click(function(event){
			g_bo = inserted;
			show_boprops(inserted);
			
		});
		
		inserted.dblclick(function(event){
			// inserted.balloon({ position: "bottom right" });
			// $("#console").balloon({ position: "bottom right" });
			// alert("dbc");
			// $("#balloon").toggle(
			// 							function(){
			// 								$(this).animate({height: 'toggle', opacity: 'toggle'}, "slow");
			// 							},
			// 							function(){
			// 								$(this).animate({height: 'toggle', opacity: 'toggle'}, "slow");
			// 							});	
			show_balloon_for_bo(true, event.clientX, event.clientY);
			g_bo = inserted;
			
		});		
		g_bo = inserted;
			
		
	}

	function render_bo_fields(bo){
		ret = "";
		// alert(inspect(bo.fields.length));
		for (var i =0; i< bo.fields.length;i++){
			f = bo.fields[i];
			ret += "<div class=\"field\" style=\"border-bottom:1px solid grey;margin-top:5px;\" i='"+i+"'onclick=\"show_field_prop(event);\";>\
				<span class='field_name' >"+f.name+"</span> <span class='field_type' style=\"color:grey\">("+f.type+")</span></div>";
		}
		return ret;
	}

	function render_bo_field_props(f){
	
		ret =  "<div class='prop_line' style='height:30px;' >                                                                        \
			<div class='prop_name'>Name</div><div class='prop_v'  n='name'><input id='fprop_v_name' value='"+ f.name +"' onchange='on_bfprop_change(event);'></input></div>                             \
		</div>";
		
		opt = "";
		
		
		for (var i=0;i<g_type_options.length;i++){
			op = g_type_options[i];
			if (op.toLowerCase() == f.type.toLowerCase())
				opt += "<option selected>"+op+"</option>";
			else
				opt += "<option >"+op+"</option>";

		}
		ret += "<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name' >Type</div><div class='prop_v' n='type'><select id='fprop_v_type' value='"+ f.type +"' onchange='on_bfprop_change(event);'>"
			+opt +"</select></div></div>";
		
		
		 if (f.readonly )
			ret += "<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>ReadOnly</div><div class='prop_v' n='readonly'><input type='checkbox' id='prop_v_readonly' checked='checked' onchange='on_bfprop_change(event);'></input></div>      \
		</div>   ";
		else
			ret += "<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>ReadOnly</div><div class='prop_v' n='readonly'><input type='checkbox' id='prop_v_readonly' onchange='on_bfprop_change(event);'></input></div>      \
		</div>   ";	
		
		ret += "  <div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>Default value</div><div class='prop_v' n='default_value'><input id='fprop_v_default_value' onchange='on_bfprop_change(event);' value='"+f.default_value+"'></input></div>                    \
		</div>                                                                                                                       \
		<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>Length</div><div class='prop_v' n='length'><input id='bfprop_v_length' onchange='on_bfprop_change(event);' value='"+f.length+"' ></input></div>                          \
		</div>                                                                                                                       \
		<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>Enabled</div><div class='prop_v' n='enabled'><input type='checkbox' id='bfprop_v_enabled' onchange='on_bfprop_change(event);'></input></div>     \
		</div>                                                                                                                       \
		<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>Encoding</div><div class='prop_v' n='encoding'><input id='bfprop_v_encoding' onchange='on_bfprop_change(event); value='"+f.default_value+"'></input></div>                        \
		</div>                                                                                                                       \                                                                                                    \
		<div class='prop_line' style='height:30px;'>                                                                                 \
			<div class='prop_name'>unique</div><div class='prop_v' n='unique'><input type='checkbox' id='bfprop_v_unique' onchange='on_bfprop_change(event);'></input></div>      \
		</div>";
		
		return ret;
	}
	function show_field_prop(event){
		if (g_selected_bo_field != null)
			g_selected_bo_field.css("color", "#000000");
		
		g_selected_bo_field = $(event.currentTarget);
		// alert(g_selected_bo_field.html());
		g_selected_bo_field.css("color", "#9999ff");
/*		prop_list = g_selected_bo_field.find(".bo_field_prop_list");

		
		_html = prop_list.html();
		
		if (_html == ""){                    
			name = g_selected_bo_field.find("span.field_name").html(); 
			type = g_selected_bo_field.find("span.field_type").html();                                                                                 
			                                                                                
			_html = "<div class='prop_line' style='height:30px;'>                                                                        \
				<div class='prop_name'>Name</div><div class='prop_v'><input id='fprop_v_name' value='"+ name +"' onchange='on_bfprop_change(event);'></input></div>                             \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>Type</div><div class='prop_v'><select id='fprop_v_type' value='"+ type +"' onchange='on_bfprop_change(event);'>\
				<option>String</option>\
				<option>Integer</option>\
				</input></div>                             \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>ReadOnly</div><div class='prop_v'><input type='checkbox' id='prop_v_readonly' onchange='on_bfprop_change(event);'></input></div>      \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>Default value</div><div class='prop_v'><input id='fprop_v_default_value' onchange='on_bfprop_change(event);'></input></div>                    \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>Length</div><div class='prop_v'><input id='bfprop_v_length' onchange='on_bfprop_change(event);'></input></div>                          \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>Enabled</div><div class='prop_v'><input type='checkbox' id='bfprop_v_enabled' onchange='on_bfprop_change(event);'></input></div>     \
			</div>                                                                                                                       \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>Encoding</div><div class='prop_v'><input id='bfprop_v_encoding' onchange='on_bfprop_change(event);'></input></div>                        \
			</div>                                                                                                                       \                                                                                                    \
			<div class='prop_line' style='height:30px;'>                                                                                 \
				<div class='prop_name'>unique</div><div class='prop_v'><input type='checkbox' id='bfprop_v_unique' onchange='on_bfprop_change(event);'></input></div>      \
			</div>";                                                                                                                     
			prop_list.html(_html);                                                                                                       
		}                                                                                                                    
		$("#fprops").html(_html);
		*/
		i = g_selected_bo_field.attr("i");
		// alert(i);
		f  = g_bo.prop("ref").fields[i];
		// alert(inspect(f));
		_html = render_bo_field_props(f);
		// alert(_html);
		$("#fprops").html(_html);
		$("#prop_pad").css("display", "none");
		$("#field_prop_pad").css("display", "block");
	}
	function on_bfprop_change(event){
	/*	prop_list = g_selected_bo_field.find(".bo_field_prop_list");
		prop_list.html($("#fprops").html());
		currentTarget = $(event.currentTarget);
		currentTarget.parent().prop("v", currentTarget.val());
		
		if ($(event.currentTarget).prop("id") == "fprop_v_name"){			
			g_selected_bo_field.find("span.field_name").html(currentTarget.val());
		}else if ($(event.currentTarget).prop("id") == "fprop_v_type"){
			g_selected_bo_field.find("span.field_type").html(currentTarget.val());			
		}		
		
		alert(prop_list.html());
		f = prop_list.find("#"+currentTarget.prop("id"));
		if (f.size() > 0 ){
			f.val(currentTarget.val());
		}
			*/
		// alert($("#balloon_field_list").html());
		currentTarget = $(event.currentTarget);
		i = g_selected_bo_field.attr("i");
		f  = g_bo.prop("ref").fields[i];
		// alert(currentTarget);
		if (currentTarget.is(':radio,:checkbox'))
			v = currentTarget.prop('checked');
		else
			v = currentTarget.val();
			// alert(v);
		prop_name = currentTarget.parent().attr("n");
		if (prop_name == "name")
			g_selected_bo_field.find(".field_name").html(v);
		else if (prop_name == "type")
			g_selected_bo_field.find(".field_type").html(v);
		
		
		
		f[prop_name] = v;
		// alert(inspect(f));
	}
	
	function on_boprop_change(event){
	/*	bo_name = g_bo.find(".draggable_obj_name");
		bo_name.html($(event.currentTarget).val());
		
		if ($(event.currentTarget).prop("id") == "fprop_v_name"){			
			g_selected_bo_field.find("span.field_name").html($(event.currentTarget).val());
		}else if ($(event.currentTarget).prop("id") == "fprop_v_type"){
			g_selected_bo_field.find("span.field_type").html($(event.currentTarget).val());
			
		}*/
		bo = g_bo.prop('ref');
		bo.name = $("#boprop_v_name").val();
		bo.type = $("#boprop_v_type").val();
		bo.desc = $("#boprop_v_desc").val();
		// alert(bo.desc);
	
		g_bo.find(".draggable_obj_name").html(bo.name);
	}
