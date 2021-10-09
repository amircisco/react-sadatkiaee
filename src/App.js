import React, { useState, useEffect } from "react";
import logo from "./logo.jpg";
import loader from "./ajax-loader.gif"
import "./App.css";
import axios from 'axios';



function App() {

  const serverport = "https://sadat-kiaee.ir";
  const [stateType, setStateType] = useState(2);
  const [currentDate, setCurrentDate] = useState('');
  const [enterTime, setEnterTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [saveExit, setSaveExit] = useState(false);
  const [flgTextEnter, setFlgTextEnter] = useState(false);
  const [flgTextExit, setFlgTextExit] = useState(false);
  const [durringProcess, setDurringProcess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showSetting,setShowSetting] = useState(false);
  const [orginalPassword, setOrginalPassword] = useState('');
  const [mac,setMac] = useState('');
  const [isAccess, setIsAccess] = useState(false);

  useEffect(() => {
    document.title = "سیستم حضور غیاب و ساعت زنی سادات کیایی"
    checkLogin();
  }, []);

  const checkLogin = () => {    
    let refresh = localStorage.getItem('refresh');
    if (refresh!=null && refresh.length > 1) {
      let url = serverport + '/api/token/refresh/';
      let headers = { 'content-type': 'application/json' }
      let data = {
        'refresh': refresh,
      }

      setIsLoading(true)
      axios({
        url: url,
        method: 'POST',
        headers: headers,
        data: data,
      })
        .then((respons) => {
          if (respons.data.access !== undefined) {
            localStorage.setItem('access', respons.data.access)
            localStorage.setItem('groups', respons.data.groups[0])
            setIsLogin(true);
            getTime();
          }
        })
        .catch((error) => {
          console.log(error)
        }).then(() => {
          setIsLoading(false)
        });

    }


  }

  const clickedLogin = () => {
    setIsLoading(true);
    let url = serverport + '/api/token/';
    let headers = { 'content-type': 'application/json' }
    let data = {
      'mobile': mobile,
      'password': password,
    }

    axios({
      url: url,
      method: 'POST',
      headers: headers,
      data: data,
    })
      .then((respons) => {
        if (respons != null) {
          if (respons.status === 200 && respons.data.access !== undefined && respons.data.refresh !== undefined) {
            localStorage.setItem('mobile', mobile);
            localStorage.setItem('password', password);
            localStorage.setItem('refresh', respons.data.refresh);
            localStorage.setItem('access', respons.data.access);
            localStorage.setItem('groups', respons.data.groups[0])      
            setIsLogin(true);    
            getTime();
          }
        }
      })
      .catch((error) => {
        if(error.response.status == 401){
          alert('نام کاربری و رمز عبور صحیح نمیباشد');
        }
        //console.log(error)
      }).then(() => {
        setIsLoading(false)
      });

  }


  const getTime = () => {
    setIsLoading(true)
    let mac = localStorage.getItem('mac','');
    let token = localStorage.getItem('access');    
    axios({
        url: serverport + "/api/timesheet/gettimesheet/",
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'content-type': 'application/json' },
        data: { 'details': {'ssid':'','extra':'pc','mac':mac,'bssid':''} },
    }).
        then((response) => {
          
            if (response.status === 200) {
                let jdate = convert_date(response.data.current_date);
                setCurrentDate(jdate);
                setEnterTime(response.data.enter_time);
                setStateType(2);     
                setIsAccess(true);           
            }
            else if (response.status === 202) {
                let jdate = convert_date(response.data.current_date)
                setCurrentDate(jdate);
                setStateType(1);
                setIsAccess(true);
                
            }
            else if (response.status === 204) {
                setIsAccess(false);                
                alert("شما قبلا ساعت های ورود و خروج امروز را ثبت کرده اید");                
            }
            setIsLoading(false);
        }).
        catch((error) => {
            if (error.response.status === 401) {
                setIsLoading(false);
                setIsAccess(false);
                alert("شما اجازه دسترسی ندارید");
                //setAccessDenied(true);
            }
        });
  }

  const sendTime = async (ac) => {
    if (durringProcess === false) {
      setIsLoading(true);
      setFlgTextEnter(true);
      setFlgTextExit(true);
      setDurringProcess(true);
      let url = (ac === "enter") ? serverport + "/api/timesheet/entertimesheet/" : serverport + "/api/timesheet/exittimesheet/";
      let token = localStorage.getItem('access');
      axios({
        url: url,
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Authorization': 'Bearer ' + token },
        data: { 'action': ac }
      })
        .then((response) => {
          console.log(response);
          if (response.status === 200) {
            if (stateType === 1) {
              let jdate = convert_date(response.data.current_date);
              setCurrentDate(jdate);
              setEnterTime(response.data.enter_time);
              setStateType(2);
            }
            else if (stateType === 2) {
              setExitTime(response.data.exit_time);
              setSaveExit(true);
            }
          }
          setDurringProcess(false);
          setFlgTextEnter(false);
          setFlgTextExit(false);
          setIsLoading(false);
        })
        .catch((error) => {
          setFlgTextEnter(false);
          setFlgTextExit(false);
          setDurringProcess(false);
          setIsLoading(false);
          console.log(error);
        });
    }
    else {
      //Alert.alert(" در حال ارسال اطلاعات.لطفا صبر کنید");
    }
  }

  const logOut = () => {
    localStorage.removeItem('mobile');
    localStorage.removeItem('password');
    localStorage.removeItem('refresh');
    localStorage.removeItem('access');
    localStorage.removeItem('groups');
    setIsLogin(false);
  }

  const convert_date = (date) => {
    let arr_date = date.split("-");    
    return gregorian_to_jalali(parseInt(arr_date[0]),parseInt(arr_date[1]),parseInt(arr_date[2]));    
    
  }

  return (
    <div className="App">
      {
        showSetting ? 
        <div style={{position:'absolute',left:'10%',top:'10%',width:'80%',height:'80%', zIndex:9999,backgroundColor:'gray', borderRadius:10}}>
          <center>
            <br></br>
            <input onChange={(e)=>{setMac(e.target.value)}} type="text" placeholder={localStorage.getItem('mac','mac')}/><br></br><br></br>
            <input type="password" onChange={(e)=>{setOrginalPassword(e.target.value)}} /><br></br><br></br>
            <button onClick={()=>{if(orginalPassword=="cisco@cisco@123") {localStorage.setItem('mac',mac); setShowSetting(false)} else{alert("انجام نشد"); setShowSetting(false)}  }} style={{backgroundColor:'green',width:100,color:'white'}}>ذخیره</button><br></br><br></br>
            <button onClick={()=>{setShowSetting(false); }} style={{backgroundColor:'green',width:100,color:'white'}}>انصراف</button>
          </center>
        </div> :
        <button onClick={()=> setShowSetting(true)} style={{position:'absolute', bottom:10,left:10,backgroundColor:'red',padding:10,width:100,}}>تنظیمات</button>                    
      }
      { 
      isLogin ?      
      <>
      <button onClick={logOut} style={{position:'absolute', top:10,left:10,backgroundColor:'red',padding:10,width:100,}}>خروج</button>            
      <span style={{position:'absolute', top:10,right:10,color:'green',fontSize:18}}>{localStorage.getItem("mobile")}</span>
      </>
      : 
      <></>
      }
      {isLoading ? 
      <img src={loader} className="logo" />
      : 
      <img src={logo} className="logo" />
      }
      {isLogin  ? 
      <div className="container">
        
        
        { isAccess ?
        <div>
        
        <span className="currentDate">تاریخ : {currentDate}</span>
        {
          stateType === 1 ?
            
            <button onClick={() => { sendTime("enter") }} style={{ backgroundColor: '#5F9F9F', borderRadius: 10, padding: 20, color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {flgTextEnter === false ? 'ثبت ساعت شروع کار' : 'لطفا صبر نمایید'}
            </button>
            :
            <>
              <span style={{ color: 'gray', fontSize: 20, display:'block' }}>ساعت ورود : {enterTime}</span>
              {
                saveExit === true  ?
                  <span style={{ color: 'gray', fontSize: 20, display:'block',marginTop:10,marginBottom:20 }}>ساعت خروج : {exitTime}</span>
                  :
                  <button onClick={() => { sendTime("exit") }} style={{ backgroundColor: '#5F9F9F', borderRadius: 10, padding: 20,marginTop:15, color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                    {flgTextExit === false ? 'ثبت ساعت پایان کار' : 'لطفا صبر نمایید'}
                  </button>
              }
            </>
        }

      </div>
      :<></>
      }

      </div>
      :
      <div className="form" >
        <div className="input-group">
          <label htmlFor="mobile">شماره همراه</label>
          <input onChange={(e)=>{setMobile(e.target.value)}} type="text" name="mobile" placeholder="09121234567" />
        </div>
        <div className="input-group">
          <label htmlFor="password">رمز عبور</label>
          <input onChange={(e)=>{setPassword(e.target.value)}} type="password" name="password" />
        </div>
        <button onClick={clickedLogin} className="primary">ورود</button>
        {/* <ul className="parnetlist"> کارمندان مجاز این سیستم
            <div className="child">
            <li>امیر جهانی</li>
            <li>محمدرضا مختاری</li>
          </div>
        </ul> */}
      </div>
      }
      <span className="spantext">سیستم ساعت زنی و حضور غیاب سادات کیایی</span>
    </div>
  );
}


export default App;



function gregorian_to_jalali(gy, gm, gd) {
  var g_d_m, jy, jm, jd, gy2, days;
  g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gy2 = (gm > 2) ? (gy + 1) : gy;
  days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  if (days < 186) {
    jm = 1 + ~~(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + ~~((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  //return [jy, jm, jd];
  return jy+"-"+jm+"-"+jd;
}

function jalali_to_gregorian(jy, jm, jd) {
  var sal_a, gy, gm, gd, days;
  jy += 1595;
  days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy = 400 * ~~(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return [gy, gm, gd];
}


