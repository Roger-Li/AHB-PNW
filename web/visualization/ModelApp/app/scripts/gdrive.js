define(["Oauth"],function(Oauth) {

	var MIME_TYPE = "application/vnd.ahb-3pg.run";
	var TREE_MIME_TYPE = "application/vnd.ahb-3pg.tree";
	var DRIVE_API_VERSION = "v2";
	
	// google oauth access token
	var token = "";
	
	var loadedFile = null;
	var fileList = [];
	var client = null;

	function init(callback) {
		$("#save-modal").modal({
			show : false
		});
		$("#load-modal").modal({
			show : false
		});
		
		$("#save-update-btn").on('click', function() {
			updateFile(loadedFile, 
					m3PGIO.exportSetup(), 
					function(resp){
						if( resp.error ) alert("Update file failed");
						else alert("Success");
						$("#save-modal").modal('hide');
						_updateFileList();
					}
			);
		});
		
		$("#save-new-btn").on('click', function() {
			var name = $("#save-name-input").val();
			if( name.length == 0 ) {
				alert("Please provide a name");
				return;
			}
			
			saveFile(name,
					$("#save-description-input").val(),
					MIME_TYPE, 
					m3PGIO.exportSetup(), 
					function(resp) {
						if( resp.error ) alert("Save to drive failed");
						else alert("Success");
						$("#save-modal").modal('hide');
						_updateFileList();
						loadedFile = resp.id;
					}
			);
		});
		
		_createLoginBtn();

		

		_loadApi(function() {
			Oauth.isAuthorized(function(refreshToken){
				if( !refreshToken ) return;

				Oauth.getAccessToken(function(t){
					token = t;
					if( token ) _setUserInfo();
				});
			});
			
			setInterval(function() {
				_checkToken();
			}, 1000 * 5 * 60);
		});

	}

	function _createLoginBtn() {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer">Login<b class="caret"></b></a>'
				+ '<ul class="dropdown-menu">'
				+ '<li><a id="login-with-google"><i class="icon-signin"></i> Login with Google</a></li>'
				+ '</ul></li>');

		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		btn.find('#login-with-google').on('click',function() {
			btn.toggleClass('open');
			signIn(function(token) {
				_setUserInfo();
			});
		});

		$("#login-header").html("").append(btn);
	};
	
	function _setUserInfo() {
		// load user name
		$.ajax({
			url : "https://www.googleapis.com/oauth2/v1/userinfo",
			beforeSend : function(request) {
				request.setRequestHeader("Authorization",'Bearer '+ token.access_token);
			},
			success : function(data, status,xhr) {
				try {
					data = JSON.parse(data);
				} catch (e) {
				}

				_createLogoutBtn(data.name);

			},
			error : function() {
			}
		});
		
		// load user files
		_updateFileList();
	}
	
	function _updateFileList() {
		$("#gdrive-file-list").html("Loading...");
		listFiles("mimeType = '"+MIME_TYPE+"'", function(resp){

			console.log("File Request recieved!");

			if( !resp.result.items ) return $("#gdrive-file-list").html("<li>No Files</li>");
			if( resp.result.items.length == 0 ) return $("#gdrive-file-list").html("<li>No Files</li>");
			$("#gdrive-file-list").html("");
			
			fileList = resp.result.items;
			for( var i = 0; i < resp.result.items.length; i++ ) {
				var item = resp.result.items[i];
				var d = new Date(item.modifiedDate);
				$("#gdrive-file-list").append(
					$("<li><a id='"+item.id+"' url='"+item.downloadUrl+"' style='cursor:pointer'><i class='icon-file'></i> "+item.title+"</a><br />" +
					  "<span style='color:#888'>"+item.description+"</span></li>"+
					  "<span style='font-style:italic;font-size:11px;'>Last Modified: "+d.toDateString()+" "+d.toLocaleTimeString()+" by "+item.lastModifyingUserName+"</span><br />"
					  )
				);
			}
			
			$("#gdrive-file-list a").on('click', function(){
				var id = $(this).attr("id");
				getFile(id, $(this).attr("url"), function(file) {
					if( file == null ) return alert("failed to load file");
					loadedFile = id;
					
					// hide the modal
					$("#load-modal").modal('hide');

					// show the share btn
					$("#share-btn").parent().show();


					m3PGIO.loadSetup(id, file);
					alert("File Loaded");
				});
			});
		});
	}
	
	function load(id) {
		if( !token ) {
			signIn(function(token) {
				_setUserInfo();
				
				getFileMetadata(id, function(file){
					getFile(id, file.downloadUrl, function(file) {
						if( file == null ) return alert("failed to load file");
						loadedFile = id;
						m3PGIO.loadSetup(id, file);
					});
				});
				
			});
		} else {
			getFileMetadata(id, function(file){
				getFile(id, file.downloadUrl, function(file) {
					if( file == null ) return alert("failed to load file");
					loadedFile = id;
					m3PGIO.loadSetup(id, file);
				});
			});
		}
	}

	function _createLogoutBtn(name) {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer">' + name
				+ '<b class="caret"></b></a>' + '<ul class="dropdown-menu">'
				+ '<li><a id="save"><i class="icon-cloud-upload"></i> Save</a></li>'
				+ '<li style="display:none"><a id="share-btn"><i class="icon-share"></i> Share</a></li>' 
				+ '<li><a id="load"><i class="icon-cloud-download"></i> Load</a></li>' 
				+ '<li><a id="logout"><i class="icon-signout"></i> Logout</a></li>' 
				+ '</ul></li>');
		
		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		btn.find('#save').on('click', function() {
			btn.toggleClass('open');
			if( loadedFile != null) {
				var file = {};
				for( var i = 0; i < fileList.length; i++ ) {
					if( fileList[i].id == loadedFile) {
						file = fileList[i];
						break;
					}
				}
				$("#save-update-panel").show();
				var d = new Date(file.modifiedDate);
				$("#save-update-panel-inner").html(file.title+"<br />" +
					  "<span style='color:#888'>"+file.description+"</span><br />"+
					  "<span style='font-style:italic;font-size:11px;'>Last Modified: "+d.toDateString()+" "+d.toLocaleTimeString()+" by "+file.lastModifyingUserName+"</span>")
			} else {
				$("#save-update-panel").hide();
			}
			
			$("#save-modal").modal('show');
		});

		btn.find("#share-btn").on('click', function(){
			if( client == null ) {
				gapi.load('drive-share', function(){
				 	client = new gapi.drive.share.ShareClient(Oauth.APP_ID);
		    		client.setItemIds([loadedFile]);
				 	client.showSettingsDialog();
				 });
			} else {
				client.setItemIds([loadedFile]);
			 	client.showSettingsDialog();
			}
		});
		
		btn.find('#load').on('click', function() {
			btn.toggleClass('open');
			$("#load-modal").modal('show');
		});
				
		btn.find('#logout').on('click', function() {
			btn.toggleClass('open');
			token = null;
			_createLoginBtn();
		});

		$("#login-header").html("").append(btn);
	};

	// tokens expire, every once in awhile check the current token hasn't
	// if it has, then update
	function _checkToken() {
		if (!token)
			return;

		console.log("Requesting new access token (refresh)");
		Oauth.getAccessToken(function(t) {
			console.log("New token recieved");
			console.log(t);

			if( t != null ) token = t;
		});
	};

	function checkSignedIn(callback) {		
		Oauth.isAuthorized(function(token){
			if (token != null)
				callback(true);
			else
				callback(false);
		});
	};

	function signIn(callback) {
		Oauth.authorize(function(t){
			token = t;
			if (token != null) {
				if( t.error ) return callback(false);
				callback(true);
			} else {
				callback(false);
			}
		})
	};

	function getToken() {
		return token;
	};

	function _loadApi(callback) {
		gapi.client.load("drive", DRIVE_API_VERSION, function() {
			callback();
		});
	};

	function listFiles(query, callback) {
		gapi.client.drive.files.list({
			q : query + " and trashed = false"
		}).execute(function(resp) {
			callback(resp);
		});
	};

	function getFileMetadata(id, callback) {
		gapi.client.drive.files.get({
			'fileId' : id
		}).execute(function(resp) {
			callback(resp);
		});
	};

	function getFile(id, downloadUrl, callback) {
		$.ajax({
			url : downloadUrl,
			beforeSend : function(request) {
				request.setRequestHeader("Authorization", 'Bearer '
						+ token.access_token);
			},
			success : function(data, status, xhr) {
				try {
					data = JSON.parse(data);
				} catch (e) {
				}

				callback(data, id);
			},
			error : function() {
				callback({
					error : true,
					message : "Failed to load file from Google Drive"
				});
			}
		});
	};

	function saveFile(name, description, mimeType, json, callback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var metadata = {
			'title' : name,
			'description' : description,
			'mimeType' : mimeType,
		// parents : [{id: folderId}] TODO
		};

		if (typeof json == 'object')
			json = JSON.stringify(json);
		var base64Data = btoa(json);
		var multipartRequestBody = delimiter
				+ 'Content-Type: application/json\r\n\r\n'
				+ JSON.stringify(metadata) + delimiter + 'Content-Type: '
				+ mimeType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n'
				+ '\r\n' + base64Data + close_delim;

		var request = gapi.client.request({
			'path' : '/upload/drive/v2/files',
			'method' : 'POST',
			'params' : {
				'uploadType' : 'multipart'
			},
			'headers' : {
				'Content-Type' : 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body' : multipartRequestBody
		});

		request.execute(function(resp) {
			if (resp.id)
				callback(resp);
			else
				callback({
					error : true,
					message : "Failed to save"
				});
		});
	};
	
	function updateFile(fileId, json, callback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
	
		 var metadata = {};
	
	    var base64Data = btoa(JSON.stringify(json));
	    var multipartRequestBody =
	    	delimiter +
	        'Content-Type: application/json\r\n\r\n' +
	        JSON.stringify(metadata) +
	        delimiter +
	        'Content-Type: ' + MIME_TYPE + '\r\n' +
	        'Content-Transfer-Encoding: base64\r\n' +
	        '\r\n' +
	        base64Data +
	        close_delim;
	
	    var request = gapi.client.request({
	        'path': '/upload/drive/v2/files/'+fileId,
	        'method': 'PUT',
	        'params': {'uploadType': 'multipart'},
	        'headers': {
	          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
	        },
	        'body': multipartRequestBody});
	    
	    request.execute(function(resp){
	    	if( resp.id ) {
	    		callback(resp);
	    	} else {
	    		callback({
					error : true,
					message : "Failed to update"
				});
	    	}
	    });
	}

	return {
		init : init,
		checkSignedIn : checkSignedIn,
		signIn : signIn,
		getToken : getToken,
		listFiles : listFiles,
		getFileMetadata : getFileMetadata,
		load : load,

		MIME_TYPE : MIME_TYPE
	}

});
