import React, { Component, createRef } from 'react'
import { Modal } from 'react-bootstrap';
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,

} from "react-pdf-highlighter";
import "react-pdf-highlighter/dist/style.css";
import $ from 'jquery'
import '../pages/editor_pdf.css'
// import { pdfjs } from "react-pdf";
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.js",
//   import.meta.url
// ).toString();

const maxHeightHeader = 61
const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({ comment }) =>
  comment?.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

export default class EditorPdf extends Component {
  constructor(props) {
    super(props)
    // inisialisasi state
    this.state = {
      is_loading: false,
      highlights: [],
      pdfReady: false,
      url: '',
      key: ''
    }
  }

  scrollViewerTo = createRef(null)



  componentDidMount() {
    window.addEventListener("hashchange", this.scrollToHighlightFromHash);

    // pdf ready observer
    this.observer = new MutationObserver(() => {
      if (!this.state.pdfReady) return;

      const page = document.querySelector(".page");
      if (page) {
        console.log("🔥 PDF FULLY READY");
        this.observer.disconnect();

        // setTimeout(() => {
        //   this.setState({
        //     highlights: testHighlights[this.initialUrl]
        //       ? [...testHighlights[this.initialUrl]]
        //       : [],
        //   });
        // }, 1000);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  componentWillUnmount() {
    window.removeEventListener("hashchange", this.scrollToHighlightFromHash);
    if (this.observer) this.observer.disconnect();
  }

  componentDidUpdate(prevProps, prevState) {
    // if (prevProps.fileurl != this.props.fileurl) {
    //   let highlights = []
    //   if (this.props.evaluasi) {
    //     const evaluasi = JSON.parse(this.props.evaluasi)
    //     console.log('componentDidUpdate===>');
    //     console.log(evaluasi);


    //     if (evaluasi.length > 0) {

    //     }
    //   }
    //   console.log('componentDidUpdate===>22');
    //   console.log(this.props.evaluasi);
    //   this.setState(state => ({
    //     url: this.props.fileurl,
    //     highlights
    //   }))
    // }
  }



  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());
    if (!highlight) {
      console.log("TIDAKADA=>highlight", highlight);
      return
    }

    console.log("ADA=>highlight", highlight);

    const pageNumber = highlight.position.pageNumber;

    const pageEl = document.querySelector(
      `.page[data-page-number="${pageNumber}"]`
    );

    if (!pageEl) {
      console.warn("❌ page DOM belum siap:", pageNumber);
      return;
    }

    const { boundingRect } = highlight.position;

    const yOffset = boundingRect?.top
      ? boundingRect.top *
      (pageEl.getBoundingClientRect().height / boundingRect.height)
      : 0;

    pageEl.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });


    if (yOffset) {
      setTimeout(() => {
        pageEl.parentElement.scrollTop += yOffset;
      }, 50);
    }


  };


  getHighlightById = (id) => {
    console.log('getHighlightById=>');
    console.log(id);


    return this.state.highlights.find((h) => h.id == id);
  };

  resetHighlights = () => {
    this.setState({ highlights: [] });
  };

  // toggleDocument = () => {
  //   const newUrl =
  //     this.state.url === PRIMARY_PDF_URL
  //       ? SECONDARY_PDF_URL
  //       : PRIMARY_PDF_URL;

  //   this.setState({
  //     url: newUrl,
  //     highlights: testHighlights[newUrl]
  //       ? [...testHighlights[newUrl]]
  //       : [],
  //   });
  // };

  addHighlight = (highlight) => {
    console.log("Saving highlight", highlight);
    this.setState(state => ({
      highlights: [
        ...state.highlights,
        { ...highlight, id: getNextId() },
      ]
    }))
  };

  updateHighlight = (highlightId, position, content) => {
    console.log("Updating highlight", highlightId, position, content);

    this.setState(state => ({
      highlights: state.highlights.map(m => {
        let item = m
        if (item.id == highlightId) {
          item.position = {
            ...item.position,
            ...position
          }
          item.content = {
            ...item.content,
            ...content
          }
        }
        return item
      })
    }))
  };

  sidebar = () => {
    return (
      <div className="" style={{ width: "25vw", height: `calc(100vh - ${maxHeightHeader}px)`, overflowY: 'auto' }}>
        {/* <div className="description" style={{ padding: "1rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>
            react-pdf-highlighter {typeof APP_VERSION !== "undefined" ? APP_VERSION : ""}
          </h2>

          <p style={{ fontSize: "0.7rem" }}>
            <a href="https://github.com/agentcooper/react-pdf-highlighter" target="_blank" rel="noopener noreferrer">
              Open in GitHub
            </a>
          </p>

          <p>
            <small>
              To create area highlight hold ⌥ Option key (Alt), then click and
              drag.
            </small>
          </p>
        </div> */}

        <ul className="sidebar__highlights">
          {this.state.highlights.map((highlight, index) => (
            <li
              key={index}
              className="sidebar__highlight"
              onClick={() => {
                document.location.hash = `highlight-${highlight.id}`;
              }}
            >
              <div>
                <strong>{highlight.comment.text}</strong>
                {highlight.content.text ? (
                  <blockquote style={{ marginTop: "0.5rem" }}>
                    {`${highlight.content.text.slice(0, 90).trim()}…`}
                  </blockquote>
                ) : null}
                {highlight.content.image ? (
                  <div
                    className="highlight__image"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img src={highlight.content.image} alt="Screenshot" />
                  </div>
                ) : null}
              </div>
              <div className="highlight__location">
                Page {highlight.position.pageNumber}
              </div>

              {this.props.saveEvaluasi && (
                <div className="d-flex justify-content-end">
                  <button
                    className='btn btn-sm btn-danger'
                    onClick={() => {

                      if (confirm('Yakin menghapus data ini?')) {
                        this.setState(state => ({
                          highlights: state.highlights.filter(m => m.id != highlight.id)
                        }))
                      }
                    }}>Delete Note</button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* <div style={{ padding: "1rem" }}>
        <button type="button" onClick={() => {

        }}>
          Toggle PDF document
        </button>
      </div> */}

        {this.state.highlights.length > 0 && this.props.saveEvaluasi && (
          <div style={{ padding: "1rem" }}>
            <button type="button" onClick={() => {
              if (confirm('Anda yakin menghapus semua data catatan ini?')) {

                this.setState(state => ({
                  highlights: []
                }))
              }
            }}>
              Reset highlights
            </button>
          </div>
        )}
      </div>
    )
  }

  content = () => {
    return (
      <div style={{ width: "75vw", position: "relative" }}>
        <PdfLoader
          url={this.state.url}
          beforeLoad={<Spinner />}

        >
          {(pdfDocument) => {
            setTimeout(() => this.setState({ pdfReady: true }), 0);

            return (
              <PdfHighlighter
                key={this.state.key}
                highlights={this.state.highlights}
                pdfDocument={pdfDocument}
                enableAreaSelection={(e) => e.altKey}
                onScrollChange={resetHash}
                scrollRef={(scrollTo) => {
                  console.log("scrollTo READY");
                  this.scrollViewerTo = scrollTo;
                  // this.scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => this.props.saveEvaluasi && (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      this.addHighlight({
                        content,
                        position,
                        comment,
                      });
                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isText = !highlight.content?.image;

                  const component = isText ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) =>
                        this.updateHighlight(
                          highlight.id,
                          {
                            boundingRect:
                              viewportToScaled(boundingRect),
                          },
                          { image: screenshot(boundingRect) }
                        )
                      }
                    />
                  );

                  return (
                    <Popup
                      key={index}
                      popupContent={
                        <HighlightPopup
                          comment={highlight.comment}
                        />
                      }
                      onMouseOver={(content) =>
                        setTip(highlight, () => content)
                      }
                      onMouseOut={hideTip}
                    >
                      {component}
                    </Popup>
                  );
                }}
              />
            );
          }}
        </PdfLoader>
      </div>
    )
  }

  handleShow = () => {
    let highlights = []
    this.setState(state => ({
      url: this.props.fileurl,
      highlights,
      key: Date.now(),
    }), async () => {

      if (this.props.evaluasi) {
        $('.layout-app').addClass('is-loading-global')
        await setTimeout(() => {

          $('.layout-app').removeClass('is-loading-global')
          const evaluasi = JSON.parse(this.props.evaluasi)
          if (evaluasi.length > 0) {
            this.setState(state => ({
              highlights: evaluasi,
              // key: Date.now(),
            }))
          }

        }, 2000)
      }

    })
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        className=""
        onShow={() => {
          resetHash()
          this.handleShow()
        }}
        onHide={() => {
          this.props.onHide()
        }}
        size="lg"
        fullscreen
      >
        <Modal.Header closeButton={true} style={{ maxHeight: maxHeightHeader, minHeight: maxHeightHeader, height: maxHeightHeader }}>
          <Modal.Title>
            Evaluasi File

            {this.props.saveEvaluasi ? (
              <button
                onClick={() => {
                  this.props.saveEvaluasi(this.props?.file_open?.id_file || '0', this.state.highlights)
                  this.props.onHide()
                }}
                className="ms-2 btn btn-primary"
                type="button"
              >
                Save
              </button>
            ) : null}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, overflowY: 'hidden' }}>

          <div className="App" style={{ display: "flex", height: `calc(100vh - ${maxHeightHeader}px)` }} >
            {this.sidebar()}
            {this.content()}
          </div>

        </Modal.Body>

      </Modal>
    )
  }
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <div className="sk-fading-circle">
        <div className="sk-circle1 sk-circle" />
        <div className="sk-circle2 sk-circle" />
        <div className="sk-circle3 sk-circle" />
        <div className="sk-circle4 sk-circle" />
        <div className="sk-circle5 sk-circle" />
        <div className="sk-circle6 sk-circle" />
        <div className="sk-circle7 sk-circle" />
        <div className="sk-circle8 sk-circle" />
        <div className="sk-circle9 sk-circle" />
        <div className="sk-circle10 sk-circle" />
        <div className="sk-circle11 sk-circle" />
        <div className="sk-circle12 sk-circle" />
      </div>
    </div>
  );
}
