let currentToken = "";
let authorizationToken = "";

let currentActiveUsername = "";
let currentActiveIP = "";

let balanceTimeoutId = null;
let isCheckingBalance = false;
let gameAlreadyOpened = false;

// Variables para sa malinis na polling display (No spam)
let pollCount = 0;
const spinnerFrames = ['|', '/', '-', '\\'];
let spinnerIndex = 0;

function generateRandomIP() {
  const randomOctet = () => Math.floor(Math.random() * 256);
  return `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`;
}

function generateRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateRandomDeviceModel() {
  const deviceModels = [
    "M2007J20CG", "SM-G975F", "SM-A515F", "Redmi Note 9", "CPH1923",
    "LM-Q725", "TA-1053", "G973F", "Pixel 5", "OnePlus 8T",
    "SM-N975F", "CPH2173", "LM-G900", "GM1913", "Mi 10T Pro"
  ];
  return deviceModels[Math.floor(Math.random() * deviceModels.length)];
}

function generateRandomTimestamp() {
  const now = new Date();
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  const randomSeconds = Math.floor(Math.random() * 60);
  
  now.setHours(randomHours);
  now.setMinutes(randomMinutes);
  now.setSeconds(randomSeconds);
  
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// Karaniwang pag-print ng bagong log line
function logMessage(message, type = 'info') {
  const consoleEl = document.getElementById('outputConsole');
  if (!consoleEl) return;
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span>${message}</span>`;
  consoleEl.appendChild(logEntry);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// In-place dynamic logger: binabago lamang ang iisang linya para hindi mapuno ang console
function updateStatusMessage(message) {
  const consoleEl = document.getElementById('outputConsole');
  if (!consoleEl) return;
  const timestamp = new Date().toLocaleTimeString();
  
  let dynamicLine = document.getElementById('dynamicStatusLine');
  if (!dynamicLine) {
    dynamicLine = document.createElement('div');
    dynamicLine.id = 'dynamicStatusLine';
    dynamicLine.className = 'log-entry log-info';
    consoleEl.appendChild(dynamicLine);
  }
  
  dynamicLine.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span style="color: #38bdf8;">${message}</span>`;
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Pag-clear sa dynamic line kapag tapos na ang polling
function clearDynamicStatusLine() {
  const dynamicLine = document.getElementById('dynamicStatusLine');
  if (dynamicLine) {
    dynamicLine.remove();
  }
}

function loadHistory() {
  const records = JSON.parse(localStorage.getItem('gameHistory') || '[]');
  const tableBody = document.getElementById('historyTableBody');
  const countSpan = document.getElementById('historyCount');
  
  if (countSpan) countSpan.textContent = records.length;
  if (!tableBody) return;

  if (records.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No execution entries found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = records.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="color: #60a5fa; font-weight: 600;">${item.username}</td>
      <td>${item.ip}</td>
      <td>${item.time}</td>
      <td><span class="badge">OPENED</span></td>
    </tr>
  `).join('');
}

function saveToHistory(username, ip) {
  const records = JSON.parse(localStorage.getItem('gameHistory') || '[]');
  const newEntry = {
    username: username || 'Unknown',
    ip: ip || '0.0.0.0',
    time: new Date().toLocaleTimeString()
  };
  
  records.unshift(newEntry);
  localStorage.setItem('gameHistory', JSON.stringify(records));
  loadHistory();
}

function generateRandomUsername() {
  const prefixes = ["ko", "lo", "na", "ba", "ki", "ri", "ma", "si", "ta", "lu"];
  const middles = ["na", "ba", "ki", "ri", "ma", "si", "ta", "lu", "ko", "lo"];
  const suffixes = ["ba", "ki", "ri", "ma", "si", "ta", "lu", "ko", "lo", "na"];
  
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomMiddle = middles[Math.floor(Math.random() * middles.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomNum = Math.floor(10 + Math.random() * 90);
  
  return randomPrefix + randomMiddle + randomSuffix + randomNum;
}

function generateRandomData() {
  const usernameInput = document.getElementById("username");
  const mobileInput = document.getElementById("mobile");
  
  currentActiveUsername = generateRandomUsername();
  currentActiveIP = generateRandomIP();

  if (usernameInput) usernameInput.value = currentActiveUsername;
  if (mobileInput) mobileInput.value = "9" + Math.floor(100000000 + Math.random() * 900000000);
  
  logMessage(`Generated user: ${currentActiveUsername}`);
  logMessage(`Assigned Session IP: ${currentActiveIP}`, 'info');
}

async function loadCaptcha() {
  logMessage("Loading security captcha challenge...");

  try {
    const randomUUID = generateRandomUUID();
    const randomDeviceModel = generateRandomDeviceModel();
    const randomTimestamp = generateRandomTimestamp();
    
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "operating-system": "Android 16",
      "sec-ch-ua-platform": "\"Android\"",
      "authorization": "",
      "pl": "android",
      "lang": "en-us",
      "sec-ch-ua": "\"Android WebView\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
      "x-app-channel-id": "",
      "sec-ch-ua-mobile": "?1",
      "uuid": randomUUID,
      "x-requested-with": "XMLHttpRequest",
      "x-app-biu-tag": randomTimestamp,
      "version": "4.1.4",
      "device-model": randomDeviceModel,
      "origin": "https://www.d291jl.com",
      "referer": "https://www.d291jl.com/",
      "X-Forwarded-For": currentActiveIP,
      "Client-IP": currentActiveIP,
      "X-Real-IP": currentActiveIP,
      "X-Remote-IP": currentActiveIP
    };

    const response = await fetch("https://api-www.lodislotx.com/block/condition/captcha/image", {
      method: "GET",
      headers: headers
    });

    const json = await response.json();

    if (json.data && json.data.images) {
      const captchaImg = document.getElementById("captchaImage");
      if (captchaImg) captchaImg.src = json.data.images;
      currentToken = json.data.token;
      logMessage("Captcha acquired successfully.", 'success');
    } else {
      logMessage("Failed to retrieve captcha payload.", 'error');
    }
  } catch (error) {
    console.error(error);
    logMessage("Network exception on captcha challenge.", 'error');
  }
}

function stopBalanceCheckLoop() {
  if (balanceTimeoutId !== null) {
    clearTimeout(balanceTimeoutId);
    balanceTimeoutId = null;
  }
  isCheckingBalance = false;
  clearDynamicStatusLine();
}

async function checkBalance() {
  pollCount++;
  const spinner = spinnerFrames[spinnerIndex % spinnerFrames.length];
  spinnerIndex++;

  // In-place display para sa malinis na console
  updateStatusMessage(`[${spinner}] Awaiting balance update... Current check: #${pollCount}`);

  try {
    const headers = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 16; M2007J20CG Build/BAIKAL16-20260624; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/149.0.7827.114 Mobile Safari/537.36 RNDny/291jili_4.1.4_9",
      'Accept': "application/json",
      'Accept-Encoding': "gzip, deflate, br, zstd",
      'operating-system': "Android 16",
      'sec-ch-ua-platform': "\"Android\"",
      'authorization': authorizationToken,
      'pl': "android",
      'lang': "en-us",
      'sec-ch-ua': "\"Android WebView\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
      'x-app-channel-id': "",
      'sec-ch-ua-mobile': "?1",
      'uuid': generateRandomUUID(),
      'x-requested-with': "XMLHttpRequest",
      'x-app-biu-tag': generateRandomTimestamp(),
      'version': "4.1.4",
      'device-model': generateRandomDeviceModel(),
      'origin': "https://www.d291jl.com",
      'sec-fetch-site': "cross-site",
      'sec-fetch-mode': "cors",
      'sec-fetch-dest': "empty",
      'referer': "https://www.d291jl.com/",
      'accept-language': "en-US,en;q=0.9",
      'priority': "u=1, i",
      'X-Forwarded-For': currentActiveIP,
      'Client-IP': currentActiveIP,
      'X-Real-IP': currentActiveIP,
      'X-Remote-IP': currentActiveIP
    };

    const params = new URLSearchParams({ 'refresh': "1" });

    const response = await fetch("https://api-www.lodislotx.com/game/third/list?" + params.toString(), {
      method: "GET",
      headers: headers
    });

    const result = await response.json();

    if (result.state === 0 && result.data && result.data.available_balance !== undefined) {
      const balance = Number(result.data.available_balance);

      if (balance >= 800) {
        clearDynamicStatusLine();
        logMessage(`Target balance reached: ${(balance / 100).toFixed(2)} PHP`, 'success');
        return true;
      } else {
        updateStatusMessage(`[${spinner}] Balance: ${(balance / 100).toFixed(2)} PHP | Polling in progress... (#${pollCount})`);
        return false;
      }
    } else {
      updateStatusMessage(`[${spinner}] Balance response pending... (#${pollCount})`);
      return false;
    }
  } catch (error) {
    updateStatusMessage(`[!] Retrying connection... (#${pollCount})`);
    return false;
  }
}

async function executeBalancePollingStep() {
  if (!isCheckingBalance || gameAlreadyOpened) return;

  const reachedTarget = await checkBalance();

  if (!isCheckingBalance || gameAlreadyOpened) return;

  if (reachedTarget) {
    gameAlreadyOpened = true;
    stopBalanceCheckLoop();

    logMessage("Triggering game launch...", 'success');
    await openGameInNewTab();

    setTimeout(() => {
      logMessage("Preparing terminal for next cycle...", 'info');
      generateRandomData();
      loadCaptcha();
      const captchaInput = document.getElementById("captchaCodeInput");
      if (captchaInput) captchaInput.value = "";
    }, 8000);

  } else {
    if (isCheckingBalance && !gameAlreadyOpened) {
      balanceTimeoutId = setTimeout(executeBalancePollingStep, 1000);
    }
  }
}

function startBalanceCheckLoop() {
  stopBalanceCheckLoop();
  isCheckingBalance = true;
  gameAlreadyOpened = false;
  pollCount = 0;
  spinnerIndex = 0;
  logMessage("Continuous balance monitoring initialized.");
  executeBalancePollingStep();
}

async function openGameInNewTab() {
  logMessage(`Requesting Mine session URL...`);
  
  try {
    const headers = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 16; M2007J20CG Build/BAIKAL16-20260624; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/149.0.7827.114 Mobile Safari/537.36 RNDny/291jili_4.1.4_9",
      'Accept': "application/json",
      'Accept-Encoding': "gzip, deflate, br, zstd",
      'operating-system': "Android 16",
      'sec-ch-ua-platform': "\"Android\"",
      'authorization': authorizationToken,
      'pl': "android",
      'lang': "en-us",
      'sec-ch-ua': "\"Android WebView\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
      'x-app-channel-id': "",
      'sec-ch-ua-mobile': "?1",
      'uuid': generateRandomUUID(),
      'x-requested-with': "XMLHttpRequest",
      'x-app-biu-tag': generateRandomTimestamp(),
      'version': "4.1.4",
      'device-model': generateRandomDeviceModel(),
      'origin': "https://www.d291jl.com",
      'sec-fetch-site': "cross-site",
      'sec-fetch-mode': "cors",
      'sec-fetch-dest': "empty",
      'referer': "https://www.d291jl.com/",
      'accept-language': "en-US,en;q=0.9",
      'priority': "u=1, i",
      'X-Forwarded-For': currentActiveIP,
      'Client-IP': currentActiveIP,
      'X-Real-IP': currentActiveIP,
      'X-Remote-IP': currentActiveIP
    };

    const params = new URLSearchParams({ 'play_id': "9410" });

    const response = await fetch("https://api-www.lodislotx.com/game/third/app?" + params.toString(), {
      method: "GET",
      headers: headers
    });

    const result = await response.json();

    if (result.state === 0 && result.data && result.data.url) {
      window.open(result.data.url, '_blank');
      logMessage("Game instance launched in new window.", 'success');
      saveToHistory(currentActiveUsername, currentActiveIP);
    } else {
      logMessage("Failed to retrieve game URL: " + (result.message || "Unknown error"), 'error');
    }
  } catch (error) {
    console.error(error);
    logMessage("Connection failure during game launch.", 'error');
  }
}

async function claimBonus() {
  logMessage(`Submitting promotion exchange code...`);
  
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 16; M2007J20CG Build/BAIKAL16-20260624; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/149.0.7827.114 Mobile Safari/537.36 RNDny/291jili_4.1.4_9",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "operating-system": "Android 16",
      "sec-ch-ua-platform": "\"Android\"",
      "authorization": authorizationToken,
      "lang": "en-us",
      "sec-ch-ua": "\"Android WebView\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
      "x-app-channel-id": "",
      "sec-ch-ua-mobile": "?1",
      "x-requested-with": "XMLHttpRequest",
      "x-app-biu-tag": generateRandomTimestamp(),
      "content-type": "application/json;charset=UTF-8",
      "device-model": generateRandomDeviceModel(),
      "pl": "android",
      "uuid": generateRandomUUID(),
      "version": "4.1.4",
      "origin": "https://www.d291jl.com",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "referer": "https://www.d291jl.com/",
      "accept-language": "en-US,en;q=0.9",
      "priority": "u=1, i",
      "X-Forwarded-For": currentActiveIP,
      "Client-IP": currentActiveIP,
      "X-Real-IP": currentActiveIP,
      "X-Remote-IP": currentActiveIP
    };

    const payload = { "code": "Q4AVX7" };

    const response = await fetch("https://api-www.lodislotx.com/home/exchangeCode", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.state === 4407 || result.message === "Received successfully") {
      logMessage("Promotion code claimed successfully.", 'success');
      setTimeout(() => startBalanceCheckLoop(), 1000);
    } else {
      logMessage("Promotion notice: " + (result.message || "Claim pending"), 'error');
      setTimeout(() => startBalanceCheckLoop(), 1500);
    }
  } catch (error) {
    console.error(error);
    logMessage("Connection failure during promotion claim.", 'error');
  }
}

async function submitRegister() {
  const usernameInput = document.getElementById("username");
  const mobileInput = document.getElementById("mobile");
  const captchaCodeInput = document.getElementById("captchaCodeInput");

  const username = usernameInput ? usernameInput.value : "";
  const mobile = mobileInput ? mobileInput.value : "";
  const captchaCode = captchaCodeInput ? captchaCodeInput.value.trim() : "";

  if (!captchaCode) {
    logMessage("Validation error: Captcha code is required.", 'error');
    return;
  }

  stopBalanceCheckLoop();
  gameAlreadyOpened = false;

  logMessage("Submitting registration credentials...");

  const randomUUID = generateRandomUUID();
  const randomDeviceModel = generateRandomDeviceModel();
  const randomTimestamp = generateRandomTimestamp();

  const payload = {
    "dev_key": "",
    "invit_code": "",
    "channel_id": "",
    "channel_param": "",
    "clickid": "",
    "campaignid": "",
    "ground_promotion_code": "",
    "user_name": username,
    "password": "lyco12",
    "re_password": "lyco12",
    "mobile": mobile,
    "code": captchaCode,
    "token": currentToken,
    "wheelToken": ""
  };

  try {
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "operating-system": "Android 16",
      "sec-ch-ua-platform": "\"Android\"",
      "authorization": "",
      "pl": "android",
      "lang": "en-us",
      "sec-ch-ua": "\"Android WebView\";v=\"149\", \"Chromium\";v=\"149\", \"Not)A;Brand\";v=\"24\"",
      "x-app-channel-id": "",
      "sec-ch-ua-mobile": "?1",
      "uuid": randomUUID,
      "x-requested-with": "XMLHttpRequest",
      "x-app-biu-tag": randomTimestamp,
      "version": "4.1.4",
      "device-model": randomDeviceModel,
      "origin": "https://www.d291jl.com",
      "referer": "https://www.d291jl.com/",
      "content-type": "application/json;charset=UTF-8",
      "X-Forwarded-For": currentActiveIP,
      "Client-IP": currentActiveIP,
      "X-Real-IP": currentActiveIP,
      "X-Remote-IP": currentActiveIP
    };

    const response = await fetch("https://api-www.lodislotx.com/user/auth/okeRegister", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.state === 1 || result.code === 200 || result.message === "ok" || result.message === "Login successfully") {
      logMessage(`Registration successful for: ${username}`, 'success');
      
      if (result.data && result.data.auth && result.data.auth.token) {
        authorizationToken = result.data.auth.token;
        logMessage("Session token registered.");
        setTimeout(() => claimBonus(), 1000);
      }
    } else {
      logMessage("Registration rejected: " + (result.message || "Failed request"), 'error');
      
      setTimeout(() => {
        logMessage("Refreshing session identity...", 'info');
        generateRandomData();
        loadCaptcha();
        if (captchaCodeInput) captchaCodeInput.value = "";
      }, 1000);
    }
  } catch (error) {
    console.error(error);
    logMessage("Connection failure to registration server.", 'error');
  }
}

const clearBtn = document.getElementById('clearConsole');
if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    const consoleEl = document.getElementById('outputConsole');
    if (consoleEl) consoleEl.innerHTML = '';
    clearDynamicStatusLine();
    logMessage("Console buffer cleared.");
  });
}

const clearHistoryBtn = document.getElementById('clearHistoryBtn');
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', function() {
    localStorage.removeItem('gameHistory');
    loadHistory();
    logMessage("Execution logs purged.");
  });
}

const originalSubmitRegister = submitRegister;
submitRegister = async function() {
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.disabled = true;
    registerBtn.textContent = 'PROCESSING...';
  }
  
  try {
    await originalSubmitRegister.apply(this, arguments);
  } finally {
    if (registerBtn) {
      registerBtn.disabled = false;
      registerBtn.textContent = 'SUBMIT REGISTRATION';
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  logMessage("System initialization sequence complete.");
  generateRandomData();
  loadCaptcha();
  loadHistory();
  
  const regBtn = document.getElementById('registerBtn');
  if (regBtn) regBtn.addEventListener('click', submitRegister);
});
