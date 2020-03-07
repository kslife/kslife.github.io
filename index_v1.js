
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

// Create a reference from a Google Cloud Storage URI
var gsReference = storage.refFromURL('gs://kslife-001.appspot.com/202003_1.jpg')
gsReference.getDownloadURL().then(function(url){console.log(url)});

$(init);

function init()
{
	initEditor();
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
			loadContentData()
		});
	});

	$(".selector-version").change(function() {
		currDate = $(this).val();
		loadContentData();
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
		    //$(btnConfirm).addClass("hidden");
		    //$(textContent).attr("contenteditable", false);
		    //$(btnEdit).removeClass("hidden");
		    $(".editor-popup").addClass("hidden");
		    $(".text-container-list").removeClass("hidden");
		    loadContentData();
		})
		.catch(function(error) {
		    console.error("Error writing document: ", error);
		});
	});

	$(".btn-upload").change(function() {
		console.log("fdsfasdfsd");
		
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
	$(".text-content").empty();
	db.collection(currDate).get().then((querySnapshot) => {
	    querySnapshot.forEach((doc) => {
	        let contentObj = doc.data();
	        let containerId = doc.id;
	        let text = contentObj.text;
	        console.log(containerId);
	        let container = $("#"+containerId);
	        $(container.find(".text-content")).html(text);
	    });
	});
}

function openEditMode()
{
	editMode = true;
	$(".btn-edit-container").removeClass("hidden");
	$(".btn-add").removeClass("hidden");
}
function closeEditMode()
{
	editMode = false;
	$(".btn-edit-container").addClass("hidden");
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

function uploadFile(file)
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
			db.collection(currDate).doc(imageCount+"").set({
			    url: downloadURL,
			})
			.then(function() {
			   console.log("Document successfully written!");
			   imageCount++;
			   let img = $("<img>").attr('src', downloadURL);
			   $(".image-container").append(img);
			})
			.catch(function(error) {
			    console.error("Error writing document: ", error);
			});
		  });
	});
}
