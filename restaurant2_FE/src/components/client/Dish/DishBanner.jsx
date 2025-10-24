import { Link } from 'react-router-dom';
import bg2 from '../../../assets/img/bg_2.jpg.webp';
import { useEffect, useState } from 'react';

const DishBanner = () => {

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
        <div>
            {/* Banner background */}
            <div
                style={{
                    backgroundImage: `url(${bg2})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    width: '100%',
                    height: '60vh',
                    filter: 'brightness(0.3)',
                }}
            ></div>

            {/* Title over banner */}
            <div className="slide__title showtotop">Delicious Specialties</div>

            {/* Name Brand Section */}
            <section className="name__brand">
                <div
                    className="showtotop"
                    style={{
                        fontSize: '50px',
                        fontWeight: '900',
                        color: '#fff',
                        background: 'transparent',
                    }}
                >
                    Specialties
                </div>
                <ul className="breadcrumb">
                    <li className="breadcrumb__item">
                        <Link to="/">HOME</Link>{' '}
                        <i className="fa-solid fa-chevron-right"></i>
                    </li>
                    <li className="breadcrumb__item">
                        MENU <i className="fa-solid fa-chevron-right"></i>
                    </li>
                </ul>
            </section>


        </div>
    );
};

export default DishBanner;
