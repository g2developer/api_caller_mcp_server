// 직접 API 호출 테스트 스크립트
import axios from 'axios';

async function testApi() {
  try {
    // 로컬 API 호출 테스트
    console.log('테스트 1: 로컬 API 호출');
    const localResponse = await axios({
      url: 'http://localhost:8181/stock-news/api/stocks/000020',
      method: 'GET',
      timeout: 5000,
      validateStatus: (status) => true
    });
    
    console.log('로컬 API 응답 상태:', localResponse.status);
    console.log('로컬 API 응답 데이터:', localResponse.data);
    
    // IP 주소를 사용한 API 호출 테스트
    console.log('\n테스트 2: IP 주소 API 호출');
    const ipResponse = await axios({
      url: 'http://222.99.26.242:8181/stock-news/api/stocks/000020',
      method: 'GET',
      timeout: 5000,
      validateStatus: (status) => true,
      maxRedirects: 5,
      proxy: false
    });
    
    console.log('응답 상태:', ipResponse.status);
    console.log('응답 데이터:', ipResponse.data);
    
    // 공개 API 호출 테스트
    console.log('\n테스트 3: 공개 API 호출');
    const publicResponse = await axios({
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      timeout: 5000
    });
    
    console.log('공개 API 응답 상태:', publicResponse.status);
    console.log('공개 API 응답 데이터:', publicResponse.data);
    
  } catch (error) {
    console.error('API 호출 오류:', error.message);
    
    if (error.code) {
      console.error('에러 코드:', error.code);
    }
    
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 스크립트 실행
testApi();
