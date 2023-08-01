const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const targetUrl = 'https://gall.dcinside.com/mgallery/board/view/?id=mahjongsoul&no=2844&search_head=10&page=1'; // 크롤링할 웹사이트 주소
const saveDirectory = './images/1~5'; // 이미지를 저장할 폴더 경로

async function getImageUrls() {
    try {
        const response = await axios.get(targetUrl);
        const $ = cheerio.load(response.data);
        const imageUrls = [];

        // imgwrap 클래스를 가지고 있는 div 안에 있는 이미지 태그를 찾습니다.
        $('img').each((index, element) => {
            const imageUrl = $(element).attr('src');
            if (imageUrl) {
                if(imageUrl.includes('dcimg4.dcinside.co.kr')) {
                    imageUrls.push(imageUrl);
                }
            }
        });

        return imageUrls;
    } catch (error) {
        console.error('Error while fetching the page:', error.message);
        return [];
    }
}

async function downloadImages(imageUrls) {
    if (!fs.existsSync(saveDirectory)) {
        fs.mkdirSync(saveDirectory);
    }

    try {
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            const fileName = getHashedFileName(imageUrl, i); // 인덱스를 포함한 파일 이름 생성
            await new Promise((resolve, reject) => {
                const fileStream = fs.createWriteStream(`${saveDirectory}/${fileName}`);
                response.data.pipe(fileStream);
                response.data.on('end', resolve);
                response.data.on('error', reject);
            });
        }
        console.log('Image download completed.');
    } catch (error) {
        console.error('Error while downloading images:', error.message);
    }
}

function getHashedFileName(imageUrl, index) {
    // 파일 이름을 해시 값과 인덱스를 조합하여 반환
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    return `${index + 1}-${hash}.jpg`; // 파일 형식에 맞게 변경
}

(async () => {
    const imageUrls = await getImageUrls();
    downloadImages(imageUrls);
})();
