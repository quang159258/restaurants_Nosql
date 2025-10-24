
const Category = (props) => {
    const { active, setActive, categories, setType, setPage } = props;
    const handleClick = (index, id) => {
        setActive(index);
        setType(id);
        setPage(1);
    }
    return (
        <section className="category mt-5">
            <div className='container'>
                <div className="nav__change">
                    <div className="row g-0">

                        {categories.map((item, index) => (
                            <div key={index} className="nav__change__item col-12 col-md-2 mb-3">
                                <button
                                    className={`button__change ${active === index ? 'active' : ''}`}
                                    onClick={() => handleClick(index, item.id)} // item.id bây giờ có giá trị
                                >
                                    {item.name}
                                </button>
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </section>
    )

}

export default Category