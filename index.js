
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

var editMode = false;
var currDateArr = [];
var currDate;
var editor;
var currContainerId;

$(init);

function init()
{
	initEditor();
	initBtn();
}

function initEditor()
{

	CKEDITOR.replace( 'editor1' );
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