import React, { useEffect } from 'react';
import bg1 from '../../../assets/img/bg_1.jpg.webp';
import bg2 from '../../../assets/img/bg_2.jpg.webp';
import bg3 from '../../../assets/img/bg_3.jpg.webp';
import intro1 from '../../../assets/img/intro1.webp';
import intro2 from '../../../assets/img/intro2.webp';
import intro3 from '../../../assets/img/intro3.webp';
import intro4 from '../../../assets/img/intro4.webp';

const IntroSection = () => {
    useEffect(() => {
        const nav = document.querySelector('nav');
        const sections = document.querySelectorAll('section');

        if (sections[0]) sections[0].classList.add('active');
        if (sections[1]) sections[1].classList.add('active');

        const handleScroll = () => {
            if (window.scrollY > 500) {
                nav?.classList.add('nav-fixed-top');
            } else {
                nav?.classList.remove('nav-fixed-top');
            }

            sections.forEach((section) => {
                if (section.offsetTop - window.scrollY < 350) {
                    section.classList.add('active');
                }
            });
        };

        document.addEventListener('scroll', handleScroll);
        return () => document.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Slider */}
            <div id="carouselExampleAutoplaying" className="carousel slide" data-bs-ride="true">
                <div className="carousel-inner">
                    {[bg1, bg2, bg3].map((bg, idx) => (
                        <div key={idx} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                            <div
                                style={{
                                    backgroundImage: `url(${bg})`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                    width: '100%',
                                    height: '100vh',
                                    filter: 'brightness(0.3)',
                                }}
                            ></div>
                            <div className="slide__title showtotop">
                                {idx === 0 && 'BEST RESTAURANT'}
                                {idx === 1 && 'Nutritious & Tasty'}
                                {idx === 2 && 'Delicious Specialties'}
                            </div>
                        </div>
                    ))}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>

            {/* Name Brand */}
            <section className="name__brand">
                <div className="showtotop" style={{ fontFamily: 'Great Vibes, cursive' }}>
                    Feliciano
                </div>
            </section>

            {/* Menu Section */}
            <section className="menu">
                <div className="item">
                    <div className="container-fluid">
                        <div className="row">
                            {[intro1, intro2, intro3, intro4].map((img, index) => (
                                <div key={index} className={`col-md-3 showtotop dl-0${2 * (index + 1)}`}>
                                    <div className="menu__img">
                                        <img className="m-auto" src={img} alt="" />
                                    </div>
                                    <div className="menu__name ">Grilled Beef with potatoes</div>
                                    <div className="menu__ingredient">Meat, Potatoes, Rice, Tomatoe</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default IntroSection;
