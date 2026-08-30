const fs = require('fs');

// 17 columns — indices 0..16
// [tc_id, first_name, last_name, email, gender, mobile, dob_day, dob_month, dob_year,
//  subjects, hobbies, upload_file, current_address, state, city, expected_result, scenario_description]

function csvRow(cells) {
  if (cells.length !== 17) throw new Error('Row length ' + cells.length + ': ' + cells[0]);
  return cells.map(function(c) {
    if (c.indexOf(',') !== -1 || c.indexOf('"') !== -1) {
      return '"' + c.replace(/"/g, '""') + '"';
    }
    return c;
  }).join(',');
}

var IMG_JPG = 'apps/demoqa-e2e/test-data/RegistrationForm/assets/image.jpg';
var IMG_PNG = 'apps/demoqa-e2e/test-data/RegistrationForm/assets/image.png';
var IMG_MP4 = 'apps/demoqa-e2e/test-data/RegistrationForm/assets/sample.mp4';

var lines = [
  'tc_id,first_name,last_name,email,gender,mobile,dob_day,dob_month,dob_year,subjects,hobbies,upload_file,current_address,state,city,expected_result,scenario_description',
  csvRow(['TC_001','John','Smith','john.smith@example.com','Male','9876543210','15','May','2000','Maths','Sports','','120 Baker Street','NCR','Delhi','success','TC_001 - Valid form submission with all required and optional inputs']),
  csvRow(['TC_002','','','','','','','','','','','','','','','error','TC_002 - Submit empty form — all mandatory fields show validation error']),
  csvRow(['TC_003','','Smith','jane.doe@example.com','Female','9876543210','','','','','','','','','','error','TC_003 - Submit without First Name — First Name field shows validation error']),
  csvRow(['TC_004','John','','john.smith@example.com','Male','9876543210','','','','','','','','','','error','TC_004 - Submit without Last Name — Last Name field shows validation error']),
  csvRow(['TC_005','Jane','Doe','1234','Female','9876543210','','','','','','','','','','error','TC_005 - Submit with invalid email format (1234) — Email field shows validation error']),
  csvRow(['TC_006','Jane','Doe','nithin@gmail.com','Female','9876543210','','','','','','','','','','success','TC_006 - Submit with duplicate email — DemoQA has no server-side uniqueness check; form submits successfully']),
  csvRow(['TC_007','John','Smith','john.smith@example.com','MaleToFemale','9876543210','','','','','','','','','','radio_exclusion','TC_007 - Select Male then Female — only the last selected gender persists']),
  csvRow(['TC_008','John','Smith','john.smith@example.com','Male','123456','','','','','','','','','','error','TC_008 - Submit with invalid mobile number (123456) — mobile field shows validation error']),
  csvRow(['TC_009','John','Smith','john.smith@example.com','Male','9999999999','','','','','','','','','','success','TC_009 - Submit with duplicate mobile — DemoQA has no server-side uniqueness check; form submits successfully']),
  csvRow(['TC_010','John','Smith','john.smith@example.com','Male','9876543210','24','September','1999','','','','','','','success','TC_010 - Submit with past Date of Birth (24 Sep 1999) — form submits successfully']),
  csvRow(['TC_011','John','Smith','john.smith@example.com','Male','9876543210','24','September','2028','','','','','','','success','TC_011 - Submit with future Date of Birth (24 Sep 2028) — DemoQA allows future DoB; form submits successfully']),
  csvRow(['TC_012','John','Smith','john.smith@example.com','Male','9876543210','','','','Maths','','','','','','autocomplete','TC_012 - Type Maths in Subjects — autocomplete dropdown displays Maths as an option']),
  csvRow(['TC_013','John','Smith','john.smith@example.com','Male','9876543210','','','','','Sports|Reading','','','NCR','Delhi','success','TC_013 - Select Sports and Reading hobbies — both reflected in submitted form']),
  csvRow(['TC_014','John','Smith','john.smith@example.com','Male','9876543210','','','','','',IMG_JPG,'','','','success','TC_014 - Upload .jpg picture — form submits successfully']),
  csvRow(['TC_015','John','Smith','john.smith@example.com','Male','9876543210','','','','','',IMG_PNG,'','','','success','TC_015 - Upload .png picture — form submits successfully']),
  csvRow(['TC_016','John','Smith','john.smith@example.com','Male','9876543210','','','','','',IMG_MP4,'','','','invalid_file','TC_016 - Upload .mp4 file — form should not accept non-image file type']),
  csvRow(['TC_017','John','Smith','john.smith@example.com','Male','9876543210','','','','','','','Kakkattil (H.O), Kochi (P.O), 679503','','','success','TC_017 - Enter address with special characters — form submits successfully']),
  csvRow(['TC_018','John','Smith','john.smith@example.com','Male','9876543210','','','','','','','','NCR','','state_city','TC_018 - Select NCR from State dropdown — City dropdown becomes enabled']),
  csvRow(['TC_019','John','Smith','john.smith@example.com','Male','9876543210','','','','','','','','','','city_only','TC_019 - Attempt to select City without State — City dropdown remains disabled']),
  csvRow(['TC_020','John','Smith','john.smith@example.com','Male','9876543210','15','May','2000','Maths','Sports','','','NCR','Delhi','close_modal','TC_020 - Submit valid form then click Close — modal closes and is dismissed']),
];

fs.writeFileSync('apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv', lines.join('\n') + '\n');
console.log('Written ' + (lines.length - 1) + ' data rows');
