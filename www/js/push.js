var pushNotification;

function initPush() {
    pushNotification = window.plugins.pushNotification;

    console.log('init push');
    //pushNotification.unregister();
    
    if ( device.platform.toLowerCase() === 'android' ) 
    {
        pushNotification.register(
            successHandler,
            errorHandler, {
                "senderID":"578400255163",
                "ecb":"onNotificationGCM"
            });
    }
    else
    {
        pushNotification.register(
            tokenHandler,
            errorHandler, {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":"onNotificationAPN"
            });

    }

}
// result contains any message sent from the plugin call
function successHandler (result) {
    console.log('result = ' + result);
}
// result contains any error description text returned from the plugin call
function errorHandler (error) {
    console.log('error = '+error);
}
function tokenHandler (result) {
    console.log('get token '+result);

    endpointDeferred.done(function() {
        console.log('post token');

        //gapi.client.bunker1cc.weekly.regist({'token':result}).execute();
        gapi.client.bunker1cc.weekly.regist({
            'token':result,
            'os': device.platform.toLowerCase(),
            'width': window.innerWidth,
            'height': window.innerHeight
        }).execute();

    });
}

// iOS
function onNotificationAPN (event) {
    console.log("onNotificationAPN");
    if ( event.alert )
    {
        navigator.notification.alert(event.alert,null,'벙커원1교회','확인');
    }

    if ( event.sound )
    {
        var snd = new Media(event.sound);
        snd.play();
    }

    if ( event.badge )
    {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}

// Android
function onNotificationGCM(e) {
    $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

    switch( e.event )
    {
        case 'registered':
        if ( e.regid.length > 0 )
        {
            $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
            // Your GCM push server needs to know the regID before it can push to this device
            // here is where you might want to send it the regID for later use.
            console.log("regID = " + e.regid);
            endpointDeferred.done(function() {
                console.log("GCM deffered gapi call");
                gapi.client.bunker1cc.weekly.regist({
                    'token':e.regid,
                    'os': device.platform.toLowerCase(),
                    'width': window.innerWidth,
                    'height': window.innerHeight
                }).execute();
            });

        }
        break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if ( e.foreground )
            {
                $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

                // if the notification contains a soundname, play it.
                var my_media = new Media("/android_asset/www/"+e.soundname);
                my_media.play();
            }
            else
            {  
                // otherwise we were launched because the user touched a notification in the notification tray.
                if ( e.coldstart )
                {
                    $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
                }
                else
                {
                    $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
                }
            }

            navigator.notification.alert(e.payload.message,null,'벙커원1교회','확인');
            break;

        case 'error':
            $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
            break;

        default:
            $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
            break;
    }
}