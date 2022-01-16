import validate from '../helpers/validate';
import header from '../components/header';
import { handleHistory, moveToPage } from '../router';
import { getMyProfile, getSignUpName, changeUserProfile, deleteUserProfile } from '../requests';
import { $ } from '../helpers/utils';

let firstNickname = '';
let curUserId;

const $nicknameInput = $('.sign-up-form-name');
const $duplicateButton = $('.check-duplicated');
// reg 말고 ~
const regName = /^[^\s]{2,8}$/;

// html 헤더 로그인/비로그인 상태 표시
const bindEvents = () => {
  header.bindEvents();

  window.addEventListener('popstate', handleHistory);
};

const init = () => {
  bindEvents();
};

window.addEventListener('DOMContentLoaded', init);

// 프로필 정보 서버로부터 가져오기
window.onload = async () => {
  try {
    const {
      data: [user],
    } = await getMyProfile();

    // originNickname으로 변경
    firstNickname = user.nickname;
    $('#nickname').value = firstNickname;
    $('#email').value = user.email;
    $duplicateButton.removeAttribute('disabled');

    curUserId = user.id;
  } catch (e) {
    console.error(e);
  }
};

// select 2번째 태그 정적으로 추가
const $citySelect = $('#sign-up-form-city');
$citySelect.onchange = () => {
  const $districtSelect = $('#sign-up-form-district');
  let mainOption = $citySelect.options[$citySelect.selectedIndex].innerText;
  let subOptions = {
    seoul: ['강남구', '광진구', '서초구'],
    busan: ['해운대구', '민지구', '시안구'],
  };
  let subOption;
  switch (mainOption) {
    case '서울특별시':
      subOption = subOptions.seoul;
      break;
    case '부산광역시':
      subOption = subOptions.busan;
      break;
  }
  $districtSelect.options.length = 0;

  for (let i = 0; i < subOption.length; i++) {
    let option = document.createElement('option');
    option.innerText = subOption[i];
    $districtSelect.append(option);
  }
};

// 유효성 검사
$('.sign-up-form').oninput = e => {
  if (e.target.matches('#nickname')) {
    validate.nameValidate(e.target.value, 0, $profileChangeBtn);
    $nicknameInput.querySelector('.icon-success').classList.add('hidden');
    $nicknameInput.querySelector('.icon-error').classList.remove('hidden');

    if (regName.test(e.target.value)) {
      $duplicateButton.removeAttribute('disabled');
    } else {
      $duplicateButton.setAttribute('disabled', '');
    }
  } else if (e.target.matches('#password')) {
    validate.passwordValidate(e.target.value, 1, $profileChangeBtn);
    if (e.target.value)
      validate.passwordConfirmValidate(e.target.value !== $('#repassword').value, 2, $profileChangeBtn);
  } else if (e.target.matches('#repassword')) {
    if (e.target.value) validate.passwordConfirmValidate($('#password').value !== e.target.value, 2, $profileChangeBtn);
  }
};

// 닉네임 중복확인
$duplicateButton.onclick = async e => {
  e.preventDefault();
  const $errormsg = $('.sign-up-form-name').querySelector('.error');

  try {
    const name = document.querySelector('#nickname').value;
    const res = await getSignUpName(name);
    const isDuplicate = res.data.nicknameDuplication;
    // 이것도 변경해라
    const isFirstname = name === firstNickname;

    if (!isDuplicate || isFirstname) {
      $errormsg.textContent = '사용 가능한 닉네임입니다';
      $errormsg.style.color = '#2196f3';
      $nicknameInput.querySelector('.icon-error').classList.add('hidden');
      $nicknameInput.querySelector('.icon-success').classList.remove('hidden');
    } else {
      $errormsg.textContent = '이미 존재하는 닉네임입니다';
    }
  } catch (error) {
    console.error(error);
  }
};

const $profileChangeBtn = $('.profile-change-btn');
$profileChangeBtn.onclick = async e => {
  e.preventDefault();

  try {
    const nickname = $('#nickname').value;
    const password = $('#password').value;
    const city = $('#sign-up-form-city').value;
    const district = $('#sign-up-form-district').value;

    // 객체로 넘겨줘
    await changeUserProfile(curUserId, nickname, password, city, district);

    moveToPage('/mypage');
  } catch (e) {
    console.error(e);
  }
};

const handlePopup = () => {
  $('.popup').classList.toggle('hidden');
  $('.cover').classList.toggle('hidden');
  $('.popup-find-password').value = '';
  // $('.popup-button').setAttribute('disabled', '');
  $('.find-error').classList.add('hidden');
  $('.popup-find-password').focus();
};

$('.profile-delete-btn').addEventListener('click', () => {
  handlePopup();
});

$('.login-exit').addEventListener('click', handlePopup);

// $('#check-password').addEventListener('input', e => {
//   // console.log(e.target.value);

// });
// $deletePasswordCheck.oninput = async () => {
//   try {
//     const hashPassword = await axios.post('/hashPassword', {
//       password: $deletePasswordCheck.value,
//       compare: nowUserPassword,
//     });
//     console.log($deletePasswordCheck.value);
//     console.log(hashPassword.data, nowUserPassword);

//     // if ($deletePasswordCheck.value === nowUserPassword) {
//     // if (hashPassword.data === nowUserPassword) {
//     if (hashPassword) {
//       $modal.querySelector('.delete-button').removeAttribute('disabled');
//       $modalError.textContent = '버튼을 누르면 계정이 삭제됩니다.';
//     } else {
//       $modalError.textContent = '비밀번호가 일치하지 않습니다!';
//     }
//   } catch (e) {
//     console.error(e);
//   }
// };

$('.delete-button').addEventListener('click', async e => {
  e.preventDefault();

  try {
    const test = await deleteUserProfile(curUserId, $('#check-password').value);
    if (!test) {
      throw new Error('비밀번호가 일치하지 않습니다');
    }
    alert('회원 탈퇴 처리되었습니다.');
    handlePopup();
    moveToPage('/');
  } catch (error) {
    console.error(error);
    $('.find-error').classList.remove('hidden');
  }
});
