
// Global variables
var userLocation = {};

var locRef = {};

var distArr = [];

/////////////////////// Functions //////////////////////////////
// Set up firebase, load gym locations
function initMap(){
  // Initialize Firebase
  var config = {
      apiKey: "AIzaSyBdGuLDGxcqdzQIDA4oD-TDkpE12fSdkxU",
      authDomain: "gyms-e4820.firebaseapp.com",
      databaseURL: "https://gyms-e4820.firebaseio.com",
      projectId: "gyms-e4820",
      storageBucket: "gyms-e4820.appspot.com",
      messagingSenderId: "627506657696"
    };

  firebase.initializeApp(config);

  // Connect to Database gyms-e4820
  locRef = firebase.database().ref("gymlocs");
  
  /* This will overwrite all gym locations and related reservations
  // Load gym locations - "set" for overwrite
  locRef.set({
     "New York 1": {
        lat: 40.766020,
        lng: -73.976515,
        addr: "110 Central Park S, New York, NY 10019"
     },     
     "New York 2": {
        lat: 40.862887,
        lng:-73.900641,
        addr: "3 E Fordham Rd, Bronx, NY 10468"
     },
     "Seattle 1": {
        lat: 47.604044,
        lng: -122.335048,
        addr: "109 Marion St, Seattle, WA 98104"
     },
     "Seattle 2": {
        lat: 47.676063,
        lng: -122.317895,
        addr: "914 NE 65th St, Seattle, WA 98115"
     }
  }); 
  */
}

// Calcuate distance
function distance(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c * 0.62137121212121; // Distance in miles
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


// Get all gym locations from database
function getLocations() {
  // Get current location
  navigator.geolocation.getCurrentPosition(function(position) 
   {
      // Obtain and set userLocation
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      // Call all elements from database
      locRef.once("value").then(function(snapshot) {
      // returns all gym locations
      var allLocations = snapshot.val();
      // loop through all gym locations
      for (var loc in allLocations) {
        var gym = {
          lat: allLocations[loc].lat,
          lng: allLocations[loc].lng,
          city: loc, //unique id
          addr: allLocations[loc].addr
        };
        // calculate each city's distance to user location
        dist = distance(gym.lat, gym.lng, userLocation.lat, userLocation.lng); 
        //console.log("You distance to " + gym.city + " is: " + dist);
        // write city and distance into an array
        distArr.push([dist, gym.city, gym.lat, gym.lng, gym.addr]);
      }
      // After the loop is done, find the shortest distance in array
      distArr.sort(function(a, b){return b[0]-a[0]});
      distArr.reverse(); //shortest length is now at index 0
      var closestDist = distArr[0][0].toFixed(1); 
      var closestLat = distArr[0][2];
      var closestLng = distArr[0][3];
      var closestAdd = distArr[0][4];
      var closestCity = distArr[0][1];
      // This element will bind to the HTML
      var closestLoc = {lat:closestLat, lng:closestLng, addr: closestAdd, city: closestCity};

      // Update the map with closest gym
      var map = new google.maps.Map(document.getElementById('map'), 
      {
        center: closestLoc,
        zoom: 15,
        scrollwheel: false,
        styles: [{"featureType":"all","elementType":"geometry.fill","stylers":[{"weight":"2.00"}]},
        {"featureType":"all","elementType":"geometry.stroke","stylers":[{"color":"#9c9c9c"}]},
        {"featureType":"all","elementType":"labels.text","stylers":[{"visibility":"on"}]},
        {"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},
        {"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},
        {"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},
        {"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},
        {"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},
        {"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#eeeeee"}]},
        {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#7b7b7b"}]},
        {"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},
        {"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},
        {"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},
        {"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},
        {"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]},
        {"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#c8d7d4"}]},
        {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#070707"}]},
        {"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]}]
      });

      var image = "img/icon.png"

      var contentString = '<div id="content">' + 
                          '<div id="GymDist">'+
                          '</div>'+ '<h4> Distance to you: ' + closestDist + ' mile(s)</h4>'

      var infowindow = new google.maps.InfoWindow({
          content: contentString
        });
      // Put the marker on the gym
      var marker = new google.maps.Marker({
        position: closestLoc,
        map: map,
        icon: image,
        animation: google.maps.Animation.DROP
      });

      marker.addListener('click', function() {
          infowindow.open(map, marker);
      });
      // Update the HTML
      // Get the HTML from our Handlebars loc-template template
      var source = $("#loc-template").html();
      // Compile our Handlebars template
      var template = Handlebars.compile(source);
      // Pass the data for this gym into the template
      var locElement = template(closestLoc);
      // Append the li tag with address back to list
      $('.loc').html(locElement);
      //console.log($('.loc span:first-child').text());
    })

  }, function (error) {
      console.log("Error: " + error.code);
  });

}

function makeReservations (userInput) {
  // Write to reservation to database under the selected gym - "push" for add
  locRef = firebase.database().ref("gymlocs/" + $('#Gym').text() + "/reservations");
  locRef.push({
        name: userInput.uName,
        email: userInput.uEmail,
        date: userInput.uDate,
        time: userInput.uTime,
     });
}

// Click event on button "Submit"
$("button").on('click', function(e){
  e.preventDefault();
  // grab reservation info from HTML
  var userInput = {
    uName:$('#Name').val(), 
    uEmail:$('#Email').val(),
    uDate:$('#Date').val(),
    uTime:$('#Time').val(),
    uGym:$('#Gym').text() //gym ID
  };
  // if all fields have been populated
  if(userInput.uName && userInput.uEmail && userInput.uDate && userInput.uTime && userInput.uGym) {
    // send them to database
    makeReservations(userInput);
    // notify the user reservation has been made
    alert(`Your reservation for
      Name: ${userInput.uName}
      Email: ${userInput.uEmail}
      Date: ${userInput.uDate}
      Time: ${userInput.uTime}
      Gym: ${userInput.uGym}
      has been submitted successfully`);          
  } else {
    alert("You have not filled out all the fields, please try again");
  }
});

getLocations();
