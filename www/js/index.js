/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();        
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');    
        initPush();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

Array.prototype.remove = function(x) {
    for (i in this) {
        if (this[i] == x) {
            this.splice(i, 1);
        }
    }
};


var downloading=[];
var weeklies = new WeeklyDB();
var current_weekly = null;

var list_template = Handlebars.compile($("#weekly-list-template").html());
var menu_template = Handlebars.compile($("#menu-template").html());

function showLoading(count) {
    var text = "다운로드 중...";
    if ( count > 1 ) 
        text = ""+count+"개 항목 "+text;

    $.mobile.loading( "show", {
        text: text,
        textVisible: true,
        theme: 'b',
        textonly: false,
        html: ""
    });

    $("body").append('<div class="modalWindow"/>');
}
function startLoading(weekly) {
    if ( $.inArray(weekly,downloading) != -1 ) return false;
    
    downloading.push(weekly);
    showLoading(downloading.length);

    return true;
}

function stopLoading(weekly) {
    downloading.remove(weekly);   

    // if ( downloading.length ) {
    //     showLoading(downloading.length);
    // } else {
       $.mobile.loading( "hide" );
       $(".modalWindow").remove();
    // }

}

function download(weekly) {

    if ( !startLoading(weekly) ) return;
    //var uri = encodeURI("http://bunker1church.com/wp-content/uploads/2014/02/140223_.pdf");
    //var uri = encodeURI("http://cfs12.tistory.com/upload_control/download.blog?fhandle=YmxvZzMwMDUyNkBmczEyLnRpc3RvcnkuY29tOi9hdHRhY2gvMC8yMC5qcGc%3D");
    //var uri= encodeURI("https://docs.google.com/viewer?url="+link+"&a=bi&pagenumber=2&w=600");
    var uri= encodeURI(weekly.link);



    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function (fs) {

            console.log("dir root:"+fs.root.fullPath);
            fs.root.getDirectory('downloaded', {create: true}, function(dirEntry) {


                var fileTransfer = new FileTransfer();
                console.log("dir entry 1:"+dirEntry.toURL());
                console.log("dir entry 2:"+dirEntry.fullPath);


                fileTransfer.download(uri, dirEntry.toURL() + "/" + weekly.date + '.pdf' ,
                    function(entry) { // download success
                    


                        weekly.locallink = entry.toURL();
                        weekly.fullpath = entry.fullPath;
                        weeklies.save();


                        stopLoading(weekly);
                        updateCurrentWeekly();

                    },
                    function(error) {
                        navigator.notification.alert('네트워크 연결상태를 확인해주세요!',null,'네트워크 에러!','확인');

console.log("error1");

                        stopLoading(weekly);
                    }
                ); // irrelevant download error
            }, 
            function(error) {
console.log("error2");

                stopLoading(weekly);
            }); // directory error 
        },
        function(error) {
console.log("error3");

            stopLoading(weekly);
        } // irrelevant request fileSystem error
    );


}

var endpointDeferred = $.Deferred();

function initEndpoint() {
    // Loads the OAuth and helloworld APIs asynchronously, and triggers login
    // when they have completed.
    var apisToLoad;
    var callback = function() {
        if (--apisToLoad == 0) {
            console.log("== gapi fully inited! ==");

            endpointDeferred.resolve();
            requestRemote();
        }
    }

    console.log('== load gapi starting...');
    apiRoot = "https://bunker1cc.appspot.com/_ah/api";
    //apiRoot = "http://localhost:9080/_ah/api";
    apisToLoad = 1; // must match number of calls to gapi.client.load()
    gapi.client.load('bunker1cc', 'v2', callback, apiRoot);
  
}

function requestRemote() {

    $('#after-list').show();
    $('#after-list').addClass('fa fa-spinner fa-spin');

    if ( !gapi.client.bunker1cc ) {
        console.log("gapi not inited");
        return;
    }

    clearBrendnew();

    gapi.client.bunker1cc.weekly.list().execute(
        function(resp) {
            $('#after-list').removeClass('fa fa-spinner fa-spin');

            if (!resp.code) {
                $('#after-list').hide();

                updateListData(resp.items);
                updateListUI();

            } else {
                $('#after-list').addClass('fa fa-exclamation-triangle');
            }
        }   
    );
}

function clearBrendnew() {
    $.each(weeklies.data, function(idx, obj){
        delete obj.brendnew;
    });
}

function updateListData(data) {
    var data = data || [];
    $.each(data, function(idx,obj) {
        if ( !weeklies.isExist(obj.date) ) {
            obj.brendnew=true;
            weeklies.put(new Weekly(obj));
        }
    });

    weeklies.sort();
    weeklies.setLastUpdate($.now());
}

function updateListUI() {
    if ( !$('#weekly-list') ) return;

    var weekly_list = [];
    $.each(weeklies.getList(), function(idx, obj) {
        weekly_list.push(obj);
        
        if ( obj.locallink ) {
            obj.areaClass = "loaded";
        } else if ( $.inArray(obj, downloading) != -1 ) {
            obj.areaClass = "loading";
        } else {
            obj.areaClass = "";
        }

    });

try{
    var html = list_template({items:weekly_list});
    $('#weekly-list').html(html);
    $('#weekly-list').listview('refresh');
} catch(e) {

}
    bindRule($('#weekly-list'));
    $('#blog-main').scroll(0);
}

function updateCurrentWeekly() {
    if ( !current_weekly ) 
        current_weekly = weeklies.getLastest();

    if ( !current_weekly ) {
        $('#no-weekly-download').hide();
        $('#no-weekly-selected').show();
        $('#weekly-view').hide();

    } else {        
        $('#weekly-date').text(current_weekly.getShortDateString());
        $('#weekly-title').text(current_weekly.title);
        $('#weekly-name').text(current_weekly.speaker);

        if ( !current_weekly.locallink ) {

            $('#no-weekly-download a[rule="download"]').attr('when',current_weekly.date);

            $('#no-weekly-download').show();
            $('#no-weekly-selected').hide();
            $('#weekly-view').hide();
        } else {
            $('#no-weekly-download').hide();
            $('#no-weekly-selected').hide();

            $('#weekly-view').show();

            if ( device.platform.toLowerCase() === 'android1') {
                console.log('locallink:'+current_weekly.locallink);
                console.log('fullpath:'+current_weekly.fullpath);
                window.plugins.webintent.startActivity({
                        action: window.plugins.webintent.ACTION_VIEW,
                        type: "application/pdf",
                        url: encodeURI(current_weekly.locallink)
                    },
                    function() {console.log('success');},
                    function() {console.log('Failed to open URL via Android Intent:'+current_weekly);}
                );
            } else {
                var ref = window.open(current_weekly.locallink, "_blank", "location=no");
                ref.addEventListener('exit', function() {     
                    $('[data-role="navbar"] a[href="#page-weekly"]').click();
                });
            }
        }
    }

}

function onDownload(weekly) {
    download(weekly);
}

function onView(weekly) {
    current_weekly = weekly;
    $('[data-role="navbar"] a[href="#page-view"]').click();
}

function onRemove(weekly) {

}

function bindRule(target) {
    target.find('a[rule]').on('click', function(e){
        e.preventDefault();
        
        if ( downloading.length ) return; // on download ignore all click

        var button = $(this);

        var weekly = weeklies.get(button.attr('when'));
        var rule = button.attr('rule');

        console.log('rule! '+rule);

        if ( rule == 'download' )  {
            onDownload(weekly);

        } else if ( rule == 'remove' ) {
            onRemove(weekly);

        } else {
            onView(weekly);
        }
        
    });
}

function setupMenu() {
    var menu = [];

    $('[data-role="page"][tab-icon]').each(function(idx,obj) {
        var icon = $(obj).attr('tab-icon');
        var id = "#"+$(obj).attr('id');

        menu.push({
            id:id,
            icon:icon,
        });

    });

    var footer=$('[data-role="footer"]');

    footer.html(menu_template({menu:menu}));
    footer.trigger('create');
}
  
  function loadMapScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCYmcLNq1RNPeT5Pez6v5FitWFenhlxPqM&v=3.exp&sensor=true&' +
    'callback=initializeMap';
    document.body.appendChild(script);
  }


  function initializeMap() {
    var church = new google.maps.LatLng(37.5781682,127.0047038);
    
    var mapOptions = {
      center: church,
      zoom: 17
    };

    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);

    var marker = new google.maps.Marker({
      map:map,
      draggable:true,
      animation: google.maps.Animation.DROP,
      position: church
    });
  }


function setCurrentTab(tab) {
    if ( $(tab).attr('in') ) return;

    $('a[href="'+tab+'"]').addClass('ui-btn-active');
}

var start_page = '#page-weekly';
$(function() {
    bindRule($('#no-weekly-download'));

    updateListData();
    updateListUI();
    
    // init app
    setupMenu();
    $( "[data-role='navbar']" ).navbar();
    $( "[data-role='footer']" ).toolbar();

    setCurrentTab(start_page);

    // bind tab handlers
    $('#page-view').on('pagebeforeshow', function(e,data) {
        updateCurrentWeekly();
    });    

    $('#page-weekly').on('pagebeforeshow', function(e,data) {
        requestRemote();
    });

    $('#page-map').on('pageshow', function(e,data) {
        if ( typeof google === 'undefined' ) 
            loadMapScript();
        else
            initializeMap(); 
    });

    $('[data-role="page"]').on('pageshow', function(e,data) {
        setCurrentTab("#"+$(this).attr('id'));
    });   

    $('a[data-transition]').on('click', function(e,data) {
        setCurrentTab("#"+$(this).attr('id'));
    });   

    $('[data-role="page"][in]').on('swiperight', function(e) {
        if ( $(this).attr('id') !== "page-map" ) 
            $.mobile.back();
    })

});

