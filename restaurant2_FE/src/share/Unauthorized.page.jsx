import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <Result
                status="403"
                title="403"
                subTitle="Bạn không có quyền truy cập vào trang này."
                extra={
                    <Link to="/">
                        <Button type="primary">Quay về trang chủ</Button>
                    </Link>
                }
            />
        </div>
    );
};

export default Unauthorized;
