import React, { Fragment, useState } from 'react'
import TooltipsApp from './TooltipsApp';
import { Modal } from 'react-bootstrap';

const InfoTooltips = (props) => {
    const [popup_open, setpopup_open] = useState(false)
    const Links = (props) => (
        <TooltipsApp {...props} />
    );
    return (
        <>
            <Links
                id={props.tooltips} title={props.tooltips}>
                <span
                    onClick={() => {
                        if (props.tooltips_table) {
                            setpopup_open(true)
                        }
                    }}
                    className={`material-icons icon-help-tooltips ${props.className || ''}`}>info</span>
            </Links>
            {props.tooltips_table && (
                <Modal
                    show={popup_open}
                    className=""
                    onShow={async () => {

                    }}
                    onHide={() => {
                        setpopup_open(false)
                    }}
                    size="lg"
                >
                    <Modal.Header closeButton={true}>
                        <Modal.Title>
                            Petunjuk Pengisian CSA
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <table className="table">
                            <tbody>
                                {props.tooltips_table.map((m, i) => (
                                    <Fragment key={i}>
                                        <tr>
                                            <td className='border bold' colSpan={2}>{m.label}</td>
                                        </tr>
                                        {m.child.map((x, y) => (
                                            <tr>
                                                <td style={{ width: 1 }} className='text-center border bold'>{y + 1}</td>
                                                <td className='border'>
                                                    {x.desc}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))}

                            </tbody>
                        </table>
                    </Modal.Body>

                </Modal>
            )}
        </>

    )
}

export default InfoTooltips