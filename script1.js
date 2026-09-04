function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.username, data.noHp, data.score]);
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  data.shift(); // Hapus baris header
  
  // Urutkan berdasarkan skor tertinggi
  data.sort(function(a, b) { return b[2] - a[2]; });
  
  // Ambil 5 data teratas untuk leaderboard
  return ContentService.createTextOutput(JSON.stringify(data.slice(0, 5))).setMimeType(ContentService.MimeType.JSON);
}

