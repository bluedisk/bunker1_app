var __LOCALSTORAGE_SERMON_PREFIX__ = 'local-weekly-';
var __LOCALSTORAGE_SERMON_LIST_KEY__ = __LOCALSTORAGE_SERMON_PREFIX__ + "list";
var __LOCALSTORAGE_SERMON_UPDATED_KEY__ = __LOCALSTORAGE_SERMON_PREFIX__ + "updated";

function WeeklyDB() {
	localData = localStorage[__LOCALSTORAGE_SERMON_LIST_KEY__] || "[]";
	this.data = [];

	var self = this;

	$.each(JSON.parse(localData), function(idx, obj) {
		self.data.push(new Weekly(obj));
	});

	this.sort();
}

WeeklyDB.prototype.getLastest = function() {
	if ( this.data.length == 0 ) return null;
	return this.data[0];
}

WeeklyDB.prototype.getWeekly = function() {
	
}

WeeklyDB.prototype.getList = function() {
	return this.data;
}

WeeklyDB.prototype.get = function(when) {
	for ( var i=0 ; i < this.data.length ; i++ ) {
		if ( this.data[i].date == when ) return this.data[i];
	}

	return null;
}

WeeklyDB.prototype.put = function(weekly) {
	this.data.push(weekly);
	this.save();
}

WeeklyDB.prototype.sort = function() {
	this.data.sort(function(a,b) {
		return b.date - a.date;
	});
}

WeeklyDB.prototype.save = function() {
	localStorage[__LOCALSTORAGE_SERMON_LIST_KEY__] = JSON.stringify(this.data);
}

WeeklyDB.prototype.isExist = function(when) {
	return this.get(when) != null;
}

WeeklyDB.prototype.setLastUpdate = function(when) {
	localStorage[__LOCALSTORAGE_SERMON_UPDATED_KEY__] = when;
}

WeeklyDB.prototype.getLastUpdate = function() {
	return localStorage[__LOCALSTORAGE_SERMON_UPDATED_KEY__];
}

///////////////////////////////////////

function Weekly(data) {
	return $.extend(this,data);
}

Weekly.prototype.getDateString = function() {

	var re = /([0-9]{4})([0-9]{2})([0-9]{2})/g;
	var date = re.exec(this.date);

	return ""+date[1]+"년 "+date[2]+"월 "+date[3]+"일";
}

Weekly.prototype.getShortDateString = function() {

	var re = /([0-9]{4})([0-9]{2})([0-9]{2})/g;
	var date = re.exec(this.date);

	return ""+date[2]+"월 "+date[3]+"일";
}

Weekly.prototype.get = function(key) {
	return this[key];
}