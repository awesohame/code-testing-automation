import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 50,  // Number of virtual users
    duration: '30s',  // Load test duration
};

export default function () {
    let res = http.get('http://localhost:8000/healthcheck');
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    sleep(1);
}
