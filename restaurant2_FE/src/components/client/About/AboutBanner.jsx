import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bg3 from '../../../assets/img/bg_3.jpg.webp';
const AboutBanner = () => {
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
      {/* Banner */}
      <div
        style={{
          backgroundImage: `url(${bg3})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          width: '100%',
          height: '60vh',
          filter: 'brightness(0.3)',
        }}
      ></div>
      <div className="slide__title showtotop">Delicious Specialties</div>

      {/* Name Brand */}
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
          About
        </div>
        <ul className="breadcrumb">
          <li className="breadcrumb__item">
            <Link to="/">HOME</Link>{' '}
            <i className="fa-solid fa-chevron-right"></i>
          </li>
          <li className="breadcrumb__item">
            ABOUT <i className="fa-solid fa-chevron-right"></i>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AboutBanner;
