import { useEffect, useMemo, useState } from "react";
import { Input, Select, Space } from "antd";
import { fetchProvinces, fetchDistricts, fetchWards } from "../../services/location.service";

const { TextArea } = Input;

const sanitizeDetail = (value) => {
    if (!value) return "";
    return value.replace(/,/g, " ").trimStart();
};

const parseAddress = (address) => {
    if (!address) return [];
    return address.split(",").map((part) => part.trim()).filter(Boolean);
};

const normalizeName = (value) => {
    if (!value) return "";
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const composeAddress = (detail, ward, district, province) => {
    return [detail, ward, district, province].filter((part) => part && part.trim().length > 0)
        .map((part) => part.trim())
        .join(", ");
};

const AddressSelector = ({ value, onChange, disabled = false, placeholder = "Số nhà, đường" }) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [detail, setDetail] = useState("");
    const [provinceCode, setProvinceCode] = useState(null);
    const [districtCode, setDistrictCode] = useState(null);
    const [wardCode, setWardCode] = useState(null);
    const [provinceName, setProvinceName] = useState("");
    const [districtName, setDistrictName] = useState("");
    const [wardName, setWardName] = useState("");

    useEffect(() => {
        fetchProvinces()
            .then(setProvinces)
            .catch(() => setProvinces([]));
    }, []);

    useEffect(() => {
        const parts = parseAddress(value);
        if (!parts.length) {
            setDetail("");
            return;
        }
        setDetail(parts[0] || "");
    }, [value]);

    useEffect(() => {
        const parts = parseAddress(value);
        if (parts.length >= 4 && provinces.length > 0) {
            const provinceTarget = normalizeName(parts[3]);
            const province = provinces.find((item) => normalizeName(item.name) === provinceTarget);
            if (province) {
                setProvinceCode(province.code);
                setProvinceName(province.name);
            }
        }
    }, [value, provinces]);

    useEffect(() => {
        if (!provinceCode) {
            setDistricts([]);
            setDistrictCode(null);
            setDistrictName("");
            return;
        }
        fetchDistricts(provinceCode)
            .then((data) => {
                setDistricts(data);
                const parts = parseAddress(value);
                const target = parts.length >= 3 ? normalizeName(parts[2]) : null;
                if (target) {
                    const matched = data.find((item) => normalizeName(item.name) === target);
                    if (matched) {
                        setDistrictCode(matched.code);
                        setDistrictName(matched.name);
                    }
                } else {
                    setDistrictCode(null);
                    setDistrictName("");
                }
            })
            .catch(() => {
                setDistricts([]);
                setDistrictCode(null);
            });
    }, [provinceCode, value]);

    useEffect(() => {
        if (!districtCode) {
            setWards([]);
            setWardCode(null);
            setWardName("");
            return;
        }
        fetchWards(districtCode)
            .then((data) => {
                setWards(data);
                const parts = parseAddress(value);
                const target = parts.length >= 2 ? normalizeName(parts[1]) : null;
                if (target) {
                    const matched = data.find((item) => normalizeName(item.name) === target);
                    if (matched) {
                        setWardCode(matched.code);
                        setWardName(matched.name);
                    }
                } else {
                    setWardCode(null);
                    setWardName("");
                }
            })
            .catch(() => {
                setWards([]);
                setWardCode(null);
            });
    }, [districtCode, value]);

const emitChange = (nextState = {}) => {
    const nextDetail = nextState.detail ?? detail;
    const nextWard = nextState.wardName ?? wardName;
    const nextDistrict = nextState.districtName ?? districtName;
    const nextProvince = nextState.provinceName ?? provinceName;
    if (onChange) {
        onChange(composeAddress(nextDetail, nextWard, nextDistrict, nextProvince));
    }
};

    const provinceOptions = useMemo(
        () => provinces.map((item) => ({ label: item.name, value: item.code, name: item.name })),
        [provinces]
    );
    const districtOptions = useMemo(
        () => districts.map((item) => ({ label: item.name, value: item.code, name: item.name })),
        [districts]
    );
    const wardOptions = useMemo(
        () => wards.map((item) => ({ label: item.name, value: item.code, name: item.name })),
        [wards]
    );

    return (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <TextArea
                value={detail}
                disabled={disabled}
                rows={2}
                placeholder={placeholder}
                onChange={(e) => {
                    const next = sanitizeDetail(e.target.value);
                    setDetail(next);
                    emitChange({ detail: next });
                }}
            />
            <Select
                showSearch
                disabled={disabled}
                options={provinceOptions}
                placeholder="Chọn Tỉnh / Thành phố"
                value={provinceCode}
                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                onChange={(code, option) => {
                    setProvinceCode(code);
                    setProvinceName(option?.name || option?.label || "");
                    setDistrictCode(null);
                    setWardCode(null);
                    setDistrictName("");
                    setWardName("");
                    emitChange({
                        provinceName: option?.name || option?.label || "",
                        districtName: "",
                        wardName: "",
                    });
                }}
                filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                }
            />
            <Select
                showSearch
                disabled={disabled || !provinceCode}
                options={districtOptions}
                placeholder="Chọn Quận / Huyện"
                value={districtCode}
                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                onChange={(code, option) => {
                    setDistrictCode(code);
                    setDistrictName(option?.name || option?.label || "");
                    setWardCode(null);
                    setWardName("");
                    emitChange({
                        districtName: option?.name || option?.label || "",
                        wardName: "",
                    });
                }}
                filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                }
            />
            <Select
                showSearch
                disabled={disabled || !districtCode}
                options={wardOptions}
                placeholder="Chọn Phường / Xã"
                value={wardCode}
                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                onChange={(code, option) => {
                    setWardCode(code);
                    setWardName(option?.name || option?.label || "");
                    emitChange({
                        wardName: option?.name || option?.label || "",
                    });
                }}
                filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                }
            />
        </Space>
    );
};

export default AddressSelector;

