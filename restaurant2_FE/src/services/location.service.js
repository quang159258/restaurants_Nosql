const BASE_URL = "https://provinces.open-api.vn/api";

const jsonFetcher = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Không thể tải dữ liệu địa lý (${response.status})`);
    }
    return response.json();
};

export const fetchProvinces = () => {
    return jsonFetcher(`${BASE_URL}/p/`);
};

export const fetchDistricts = (provinceCode) => {
    if (!provinceCode) return Promise.resolve([]);
    return jsonFetcher(`${BASE_URL}/p/${provinceCode}?depth=2`).then((data) => data?.districts || []);
};

export const fetchWards = (districtCode) => {
    if (!districtCode) return Promise.resolve([]);
    return jsonFetcher(`${BASE_URL}/d/${districtCode}?depth=2`).then((data) => data?.wards || []);
};

