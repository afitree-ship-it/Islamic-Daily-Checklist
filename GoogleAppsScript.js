function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ดึงข้อมูลจากชีต Data (ความคืบหน้ากิจกรรม)
  var dataSheet = ss.getSheetByName("Data");
  if (!dataSheet) {
    dataSheet = ss.insertSheet("Data");
    dataSheet.appendRow(["Timestamp", "Date", "MemberId", "TaskId", "Status"]);
  }
  
  var data = dataSheet.getDataRange().getValues();
  var progress = {};
  
  for (var i = 1; i < data.length; i++) {
    var date = data[i][1];
    var memberId = data[i][2];
    var taskId = data[i][3];
    var status = data[i][4];
    
    if (taskId === 'sync_member_init' || taskId === 'sync_member_delete') {
      continue; // ข้าม log ของระบบ
    }
    
    if (!progress[date]) progress[date] = {};
    if (!progress[date][memberId]) progress[date][memberId] = {};
    
    progress[date][memberId][taskId] = (status === true || status === 'TRUE' || status === 'true');
  }

  // 2. ดึงรายชื่อจากชีต Members
  var membersSheet = ss.getSheetByName("Members");
  var activeMembers = [];
  
  if (membersSheet) {
    var membersData = membersSheet.getDataRange().getValues();
    for (var j = 1; j < membersData.length; j++) {
      var mId = membersData[j][0]; // คอลัมน์ A (Member Name)
      var mStatus = membersData[j][1]; // คอลัมน์ B (Status) - ปกติจะว่าง หรือ 'Active'
      if (mId && mStatus !== 'Deleted') {
        activeMembers.push(String(mId));
      }
    }
  }
  
  // ส่งกลับเป็น JSON ที่มีทั้ง progress และ members
  return ContentService.createTextOutput(JSON.stringify({
    progress: progress,
    members: activeMembers
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // เตรียมชีต Data
  var dataSheet = ss.getSheetByName("Data");
  if (!dataSheet) {
    dataSheet = ss.insertSheet("Data");
    dataSheet.appendRow(["Timestamp", "Date", "MemberId", "TaskId", "Status"]);
  }

  // เตรียมชีต Members
  var membersSheet = ss.getSheetByName("Members");
  if (!membersSheet) {
    membersSheet = ss.insertSheet("Members");
    membersSheet.appendRow(["MemberName", "Status", "LastUpdated"]);
  }
  
  try {
    var items = JSON.parse(e.postData.contents);
    var timestamp = new Date();
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      
      // บันทึกการเพิ่ม/ลบสมาชิกลงชีต Members ด้วย
      if (item.taskId === 'sync_member_init') {
        // เช็คว่ามีชื่อนี้ใน Members หรือยัง
        var membersData = membersSheet.getDataRange().getValues();
        var found = false;
        for (var j = 1; j < membersData.length; j++) {
          if (membersData[j][0] == item.memberId) {
            membersSheet.getRange(j + 1, 2).setValue('Active');
            membersSheet.getRange(j + 1, 3).setValue(timestamp);
            found = true;
            break;
          }
        }
        if (!found) {
          membersSheet.appendRow([item.memberId, 'Active', timestamp]);
        }
      } else if (item.taskId === 'sync_member_delete') {
        if (item.status === true || item.status === 'TRUE' || item.status === 'true') {
          var membersData = membersSheet.getDataRange().getValues();
          for (var j = 1; j < membersData.length; j++) {
            if (membersData[j][0] == item.memberId) {
              membersSheet.getRange(j + 1, 2).setValue('Deleted');
              membersSheet.getRange(j + 1, 3).setValue(timestamp);
              break;
            }
          }
        } else {
          // If status is false, they are undeleting
          var membersData = membersSheet.getDataRange().getValues();
          for (var j = 1; j < membersData.length; j++) {
            if (membersData[j][0] == item.memberId) {
              membersSheet.getRange(j + 1, 2).setValue('Active');
              membersSheet.getRange(j + 1, 3).setValue(timestamp);
              break;
            }
          }
        }
      }
      
      // บันทึก log การกระทำลงชีต Data เสมอ
      dataSheet.appendRow([
        timestamp,
        item.date,
        item.memberId,
        item.taskId,
        item.status
      ]);
    }
    
    return ContentService.createTextOutput("Success");
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message);
  }
}
