import ins1 from '../../assets/img/ins1.webp';
import ins2 from '../../assets/img/ins2.webp';
import ins3 from '../../assets/img/ins3.webp';
import ins4 from '../../assets/img/insta4.webp';
import ins5 from '../../assets/img/ins5.webp';
import ins6 from '../../assets/img/ins6.webp';
import { FacebookOutlined, TwitterOutlined, InstagramOutlined } from '@ant-design/icons';

const Footer = () => {
    return (
        <div className="footer bg-black">
            <div className="item" style={{ overflowX: 'hidden' }}>
                <div className="container">
                    <div className="row mb-5">
                        {/* Logo & Social */}
                        <div className="col-xl-3 col-md-6 col-12" style={{ color: '#fff' }}>
                            <h4 className="footer__heading">Feliciano</h4>
                            <p className="text" style={{ color: '#acabab' }}>
                                Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.
                            </p>
                            <ul className="footer__media d-flex gap-3 p-0">
                                <li className="showtotop"><TwitterOutlined /></li>
                                <li className="showtotop dl-02"><FacebookOutlined /></li>
                                <li className="showtotop dl-04"><InstagramOutlined /></li>
                            </ul>
                        </div>

                        {/* Open Hours */}
                        <div className="col-xl-3 col-md-6 col-12" style={{ color: '#fff' }}>
                            <h4 className="footer__heading">Open hours</h4>
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i}>
                                    <span>Monday</span> <span>9:00 - 24:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Instagram */}
                        <div className="col-xl-3 col-md-6 col-12" style={{ color: '#fff' }}>
                            <h4 className="footer__heading">Instagram</h4>
                            <div
                                className="list__thumd d-flex flex-wrap gap-2"
                                style={{ justifyContent: 'space-between' }} // căn đều các phần tử
                            >
                                {[ins1, ins2, ins3, ins4, ins5, ins6].map((img, i) => (
                                    <a
                                        href="#"
                                        key={i}
                                        style={{
                                            flex: '0 0 calc(33% - 8px)', // 3 ảnh 1 hàng, trừ gap
                                            height: '100px',
                                            overflow: 'hidden',
                                            display: 'block',
                                        }}
                                    >
                                        <div
                                            className="thumd"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundImage: `url(${img})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',

                                            }}
                                        ></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="col-xl-3 col-md-6 col-12" style={{ color: '#fff' }}>
                            <h4 className="footer__heading">Newsletter</h4>
                            <p style={{ color: '#acabab' }}>
                                Far far away, behind the word mountains, far from the countries.
                            </p>
                            <input type="text" placeholder="Nhập địa chỉ email" className="footer__input" />
                            <button className="order w-100" style={{ lineHeight: 2 }}>Subscribe</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
