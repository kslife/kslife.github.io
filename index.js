
// Your web app's Firebase configuration
var firebaseConfig = {
	apiKey: "AIzaSyAfvh8_J8TyUoNacRfqOBOWxBe7rrLZUmE",
    authDomain: "kslife-001.firebaseapp.com",
    databaseURL: "https://kslife-001.firebaseio.com",
    projectId: "kslife-001",
    storageBucket: "kslife-001.appspot.com",
    messagingSenderId: "225927581927",
    appId: "1:225927581927:web:2cc1ab2db282cdda6d9242",
    measurementId: "G-3BNDNRYQR8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
var storage = firebase.storage();
// Create a storage reference from our storage service
var storageRef = storage.ref();

var editMode = false;
var currDateArr = [];
var currDate;
var editor;
var currContainerId;
var imageCount = 0;

$(init);

function init()
{
	initBtn();
}

function initEditor()
{
	CKEDITOR.replace( 'editor1', {
		height: "500",
		filebrowserUploadUrl: '/uploader/upload.php',
	});
}

function initBtn()
{

	$('.btn-login').click(function() {
		db.collection("users").get().then(querySnapshot => {
			querySnapshot.forEach((doc) => {
				let userObj = doc.data();
				let password = $("#pwd").val();
				if(userObj.password == password)
				{
					$(".login-popup").addClass("hidden");
					initData();
					if(userObj.role == 2)
					{
						openEditMode();
					}
					else
					{
						closeEditMode();
					}
				}
			});
			currDate = maxInDateArr(currDateArr);
			$(".selector-version").val(currDate);
			loadContentData();
		});
	});

	$(".selector-version").change(function() {
		currDate = $(this).val();
		loadContentData();
	});

	$(".but-edit-version").click(function() {
		$(".image-container").addClass("hidden");
		$(".version-popup").removeClass("hidden");
		let version = currDate.substring(0, 4) + "-" + currDate.substring(4);
		$("#version-name").val(version);
		$(".btn-version-delete").removeClass("hidden");
	});

	$(".but-add-version").click(function() {
		$(".image-container").addClass("hidden");
		$(".version-popup").removeClass("hidden");
		$(".btn-version-delete").addClass("hidden");
	});

	$(".btn-version-confirm").click(function() {
		let version = $("#version-name").val();
		version = version.replace("-", "");

		db.collection('meta').doc(version).set({
		    visible: true,
		})
		.then(function() {
		    console.log("Document successfully written!");
		    $(".version-popup").addClass("hidden");
		    $(".image-container").removeClass("hidden");
		    if(currDateArr.indexOf(version) == -1)
		    {
		    	currDateArr.push(version);
		    	$(".selector-version").append(new Option(version, version));
		    }
		    currDate = maxInDateArr(currDateArr);
			$(".selector-version").val(currDate);
			loadContentData();
		})
		.catch(function(error) {
		    console.error("Error writing document: ", error);
		});
	});

	$(".btn-version-cancel").click(function() {
		$(".image-container").removeClass("hidden");
		$(".version-popup").addClass("hidden");
		$(".btn-version-delete").addClass("hidden");
	});

	$(".btn-version-delete").click(function() {
		db.collection("meta").doc(currDate).delete().then(function() {
		    console.log("Document successfully deleted!");
			currDateArr.splice(currDateArr.indexOf(currDate), 1);
			$(".selector-version option[value="+currDate+"]").remove();

		    currDate = maxInDateArr(currDateArr);
			$(".selector-version").val(currDate);
			$(".version-popup").addClass("hidden");
			loadContentData();

		}).catch(function(error) {
		    console.error("Error removing document: ", error);
		});

		
	});

	$(".btn-edit").click(function() {
		//$(this).addClass("hidden");
		let parent = $(this).closest(".text-container");
		currContainerId = $(parent).attr('id');
		$(parent.find(".btn-confirm")).removeClass("hidden");
		let html = $(parent.find('.text-content')).html();
		CKEDITOR.instances.editor1.setData(html);
		$(".editor-popup").removeClass("hidden");
		$(".text-container-list").addClass("hidden");
	});

	$(".btn-editor-confirm").click(function() {
		let parent = $("#"+currContainerId);
		let btnEdit = $(parent.find(".btn-edit"));
		let parentId = $(parent).attr('id');
		let textContent = $(parent.find('.text-content'));
		let text = CKEDITOR.instances.editor1.getData();
		db.collection(currDate).doc(parentId).set({
		    text: text,
		})
		.then(function() {
		    console.log("Document successfully written!");
		    $(".editor-popup").addClass("hidden");
		    $(".text-container-list").removeClass("hidden");
		    loadContentData();
		})
		.catch(function(error) {
		    console.error("Error writing document: ", error);
		});
	});

	$(".btn-upload").change(function() {
		var file = $(this)[0].files[0];
		uploadFile(file);
	});
}

function initData()
{
	currDateArr = [];
	$(".selector-version").empty();
	db.collection("meta").get().then(querySnapshot => {
		querySnapshot.forEach((doc) => {
			let metaObj = doc.data();
			if(metaObj.visible)
			{
				currDateArr.push(doc.id);
				$(".selector-version").append(new Option(doc.id, doc.id));
			}
		});
		currDate = maxInDateArr(currDateArr);
		$(".selector-version").val(currDate);
		loadContentData()
	});
}

function loadContentData()
{
	$(".image-container").empty();
	imageCount = 0;
	$(".image-container").removeClass("hidden");
	db.collection(currDate).get().then((querySnapshot) => {
	    querySnapshot.forEach((doc) => {
	    	let contentObj = doc.data();
	    	console.log(contentObj);
	       	let keys = Object.keys(contentObj);
	       	$.each(keys, function(idx, key) {
	       		let url = contentObj[key];
	       		let imgPart = $("<div>").addClass("image-part");
	       		let editPart = $("<div>").addClass("edit-mode");

	       		if(!editMode)
	       		{
	       			editPart.addClass("hidden");
	       		}
	       		let label = $("<label>").html("更換圖片：")
	       		let uploadFileBtn = $("<input>").addClass("btn-edit-img").attr("type", "file").attr("accept", "image/png, image/jpeg");
	       		uploadFileBtn.change(function() {
	       			var file = $(this)[0].files[0];
					uploadFile(file, key);
	       		});
	       		let deleteFileBtn = $("<button>").addClass("btn-delete-img").html("刪除圖片");
	       		deleteFileBtn.click(function() {
	       			var imagesRef = db.collection(currDate).doc('images');
					var imageObj = {};
					imageObj[key+""] = firebase.firestore.FieldValue.delete();
					var removeImage = imagesRef.update(imageObj);
					loadContentData();
	       		});

	       		editPart.append($("<hr>")).append(label).append(uploadFileBtn).append(deleteFileBtn);

	       		let img = $("<img>").attr('src', url).addClass("img-artical").attr("index", key);

	       		imgPart.append(editPart).append(img);
			   	$(".image-container").append(imgPart);
			   	imageCount++;
	       	});
	    });
	});
}

function openEditMode()
{
	editMode = true;
	$(".btn-edit-container").removeClass("hidden");
	$(".btn-add").removeClass("hidden");
	$(".upload-part").removeClass("hidden");
	$(".edit-mode").removeClass("hidden");
}
function closeEditMode()
{
	editMode = false;
	$(".btn-edit-container").addClass("hidden");
	$(".upload-part").addClass("hidden");
	$(".edit-mode").addClass("hidden");
}

function maxInDateArr(dateArr){
	let dataTimeArr = [];

	dateArr.forEach((dateStr) => {
		let dateTime = new Date(dateStr).getTime();
		dataTimeArr.push(dateTime);
	});
	let maxDateTime = dataTimeArr.sort((a,b) => {return b-a;})[0];
	let date = new Date();
	date.setTime(maxDateTime);
    let year = date.getFullYear();
    let month = date.getMonth();
   	
	return year+month +'';
}

function uploadFile(file, currImgIndex = -1)
{
	// Create the file metadata
	var metadata = {
	  contentType: 'image/jpeg'
	};

	// Upload file and metadata to the object 'images/mountains.jpg'
	var uploadTask = storageRef.child(currDate + '/' + file.name).put(file, metadata);

	// Listen for state changes, errors, and completion of the upload.
	uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
	  function(snapshot) {
	    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
	    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
	    console.log('Upload is ' + progress + '% done');
	    switch (snapshot.state) {
			case firebase.storage.TaskState.PAUSED: // or 'paused'
				console.log('Upload is paused');
			break;
			case firebase.storage.TaskState.RUNNING: // or 'running'
				console.log('Upload is running');
			break;
	    }
	  }, function(error) {

	  // A full list of error codes is available at
	  // https://firebase.google.com/docs/storage/web/handle-errors
	  switch (error.code) {
	    case 'storage/unauthorized':
	      // User doesn't have permission to access the object
	      break;

	    case 'storage/canceled':
	      // User canceled the upload
	      break;
	    case 'storage/unknown':
	      // Unknown error occurred, inspect error.serverResponse
	      break;
	  }
	}, function() {
	  // Upload completed successfully, now we can get the download URL
	  uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
			console.log('File available at', downloadURL);
			let setData = {};
			if(currImgIndex >= 0)
			{
				setData[currImgIndex] = downloadURL;
			}
			else
			{
				setData[imageCount] = downloadURL;
			}
			db.collection(currDate).doc('images').set(setData, {merge:true})
			.then(function() {
				console.log("Document successfully written!");
			   	if(currImgIndex >= 0)
			   	{
			   		$(".img-artical[index="+currImgIndex+"]").attr("src", downloadURL);
			   	}
			   	else
			   	{
			   		let idx = imageCount;
			   		let imgPart = $("<div>").addClass("image-part");
		       		let editPart = $("<div>").addClass("edit-mode");

		       		if(!editMode)
		       		{
		       			editPart.addClass("hidden");
		       		}
		       		let label = $("<label>").html("更換圖片：")
		       		let uploadFileBtn = $("<input>").addClass("btn-edit-img").attr("type", "file").attr("accept", "image/png, image/jpeg");
		       		uploadFileBtn.change(function() {
		       			var file = $(this)[0].files[0];
						uploadFile(file, idx);
		       		});
		       		let deleteFileBtn = $("<button>").addClass("btn-delete-img").html("刪除圖片");
		       		deleteFileBtn.click(function() {
						var imagesRef = db.collection(currDate).doc('images');
						var imageObj = {};
						imageObj[idx+""] = firebase.firestore.FieldValue.delete();
						var removeImage = imagesRef.update(imageObj);
						loadContentData();
		       		});

	       			editPart.append($("<hr>")).append(label).append(uploadFileBtn).append(deleteFileBtn);

			   		let img = $("<img>").attr('src', downloadURL).addClass("img-artical").attr("index", idx);

		       		imgPart.append(editPart).append(img);
				   	$(".image-container").append(imgPart);
				   	imageCount++;
				}
			})
			.catch(function(error) {
			    console.error("Error writing document: ", error);
			});
		 });
	});
}
