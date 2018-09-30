import React from "react";
import Select from "react-select";
import _ from "lodash";
import Dropzone from "react-dropzone";
import RichTextEditor from "react-rte";
import { tags } from "../tags";
import firebase from "../firebase";

class PostForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      titlePhoto: "",
      titlePhotoUrl: "",
      titlePhotoUploadProgress: 0,
      filteredTags: [],
      mainTags: [],
      mainTagsValues: [],
      subTagsOptions: [],
      subTags: [],
      subTagsValues: [],
      subSubTagsOptions: [],
      subSubTags: [],
      subSubTagsValues: [],
      sections: [],
      uploadingFile: false,
      submitting: false
    };
  }

  handleMainTagChange(value) {
    let subTagsOptions = value.map(tag => tag.subTags).flat();
    subTagsOptions = _.uniqBy(subTagsOptions, "value");
    const mainTagsValues = value.map(tag => tag.value);
    this.setState({ mainTags: value, mainTagsValues, subTagsOptions });
  }

  handleSubTagChange(value) {
    let subSubTagsOptions = value.map(tag => tag.subTags).flat();
    subSubTagsOptions = _.uniqBy(subSubTagsOptions, "value");
    const subTagsValues = value.map(tag => tag.value);
    this.setState({ subTags: value, subTagsValues, subSubTagsOptions });
  }

  handleSubSubTagChange(value) {
    const subSubTagsValues = value.map(tag => tag.value);
    this.setState({ subSubTags: value, subSubTagsValues });
  }

  async handleTitlePhotoChange(image) {
    console.log(image);
    this.setState({
      uploadingFile: true,
      titlePhoto: image.preview
    });
    const storage = firebase.storage();
    const storageRef = storage.ref(image.name);
    const uploadTask = storageRef.put(image);
    uploadTask.on(
      "state_changed",
      async snapshot => {
        const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.setState({ titlePhotoUploadProgress: uploadProgress });
      },
      error => this.setState({ uploadingFile: false }),
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        console.log("fileSnapshot", downloadURL);
        this.setState({
          titlePhotoUrl: downloadURL,
          uploadingFile: false
        });
      }
    );
  }

  async handleFileChange(file, index) {
    this.setState({ uploadingFile: true });
    const storage = firebase.storage();
    const storageRef = storage.ref(file.name);
    const uploadTask = storageRef.put(file);
    uploadTask.on(
      "state_changed",
      async snapshot => {
        const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.setState(prevState => {
          const newSections = [...prevState.sections];
          newSections[index] = {
            ...prevState.sections[index],
            uploadProgress
          };
          return { sections: newSections };
        });
      },
      error => this.setState({ uploadingFile: false }),
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        console.log("fileSnapshot", downloadURL);
        this.setState(prevState => {
          const newSections = [...prevState.sections];
          newSections[index] = {
            ...prevState.sections[index],
            value: downloadURL,
            preview: file.preview
          };
          return { sections: newSections, uploadingFile: false };
        });
      }
    );
  }

  handleAddSection(type) {
    switch (type) {
      default:
        return null;
      case "text":
        this.setState(prevState => ({
          sections: [
            ...prevState.sections,
            {
              type,
              value: "",
              editorValue: RichTextEditor.createEmptyValue()
            }
          ]
        }));
        break;
      case "embed":
        this.setState(prevState => ({
          sections: [
            ...prevState.sections,
            {
              type,
              value: ""
            }
          ]
        }));
        break;
      case "image":
        this.setState(prevState => ({
          sections: [
            ...prevState.sections,
            {
              type,
              value: "",
              uploadProgress: 0,
              preview: ""
            }
          ]
        }));
        break;
    }
  }

  async handleSubmit(e) {
    console.log("submitting");
    this.setState({ submitting: true });
    e.preventDefault();
    const newSections = this.state.sections.map(sec => ({
      type: sec.type,
      value: sec.value
    }));
    const data = {
      title: this.state.title,
      titlePhoto: this.state.titlePhotoUrl,
      sections: newSections,
      mainTags: this.state.mainTagsValues,
      subTags: this.state.subSubTagsValues,
      subSubTags: this.state.subSubTagsValues,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const firestore = firebase.firestore();
    const postRef = await firestore
      .collection("posts")
      .doc()
      .set(data);
    this.setState({ submitting: false });
    console.log(postRef);
  }

  renderSections() {
    return this.state.sections.map((section, index) => {
      switch (section.type) {
        default:
          return null;
        case "text":
          return (
            <div key={`section-${index}`} className="field">
              <label className="label">Κείμενο</label>
              <RichTextEditor
                value={this.state.sections[index].editorValue}
                onChange={value => {
                  const editorValue = value;
                  this.setState(prevState => {
                    const newSections = [...prevState.sections];
                    newSections[index] = {
                      ...prevState.sections[index],
                      editorValue,
                      value: value.toString("html")
                    };
                    return { sections: newSections };
                  });
                }}
              />
            </div>
          );
        case "embed":
          return (
            <div key={`section-${index}`} className="field">
              <label className="label">Youtube - Twitter embed tags</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={this.state.sections[index].value}
                  onChange={e => {
                    const value = e.target.value;
                    this.setState(prevState => {
                      const newSections = [...prevState.sections];
                      newSections[index] = {
                        ...prevState.sections[index],
                        value
                      };
                      return { sections: newSections };
                    });
                  }}
                />
              </div>
            </div>
          );
        case "image":
          return (
            <Dropzone
              key={`section-${index}`}
              style={{ position: "relative" }}
              onDrop={files => this.handleFileChange(files[0], index)}
              multiple={false}
              disabled={this.state.uploadingFile}
            >
              <div className="field">
                <div className="file has-name is-fullwidth">
                  <label className="file-label">
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fas fa-upload" />
                      </span>
                      <span className="file-label">Επίλεξε αρχείο</span>
                    </span>
                    <span className="file-name" />
                  </label>
                </div>
              </div>
              {this.state.uploadingFile && (
                <progress
                  className="progress is-primary"
                  value={this.state.sections[index].uploadProgress}
                  max="100"
                />
              )}
              <img src={this.state.sections[index].preview} alt="" />
            </Dropzone>
          );
      }
    });
  }

  render() {
    const isValid =
      this.state.sections.length > 0 &&
      !!this.state.title &&
      !!this.state.titlePhotoUrl &&
      !this.state.uploadingFile;
    return (
      <form onSubmit={e => this.handleSubmit(e)}>
        <div className="field">
          <label className="label">Τίτλος</label>
          <div className="control">
            <input
              className="input"
              type="text"
              placeholder="Ο τίτλος του άρθρου εδώ..."
              value={this.state.title}
              onChange={e => this.setState({ title: e.target.value })}
            />
          </div>
        </div>
        <Dropzone
          style={{ position: "relative" }}
          onDrop={files => this.handleTitlePhotoChange(files[0])}
          multiple={false}
          disabled={this.state.uploadingFile}
        >
          <div className="field">
            <div className="file has-name is-fullwidth">
              <label className="file-label">
                <span className="file-cta">
                  <span className="file-icon">
                    <i className="fas fa-upload" />
                  </span>
                  <span className="file-label">Εικόνα τίτλου</span>
                </span>
                <span className="file-name" />
              </label>
            </div>
          </div>
          {this.state.uploadingFile && (
            <progress
              className="progress is-primary"
              value={this.state.titlePhotoUploadProgress}
              max="100"
            />
          )}
          <img src={this.state.titlePhoto} alt="" />
        </Dropzone>
        {this.renderSections()}
        <div className="field is-grouped">
          <p className="control">
            <button
              type="button"
              className="button is-primary"
              onClick={() => this.handleAddSection("text")}
            >
              Add text
            </button>
          </p>
          <p className="control">
            <button
              type="button"
              className="button is-link"
              onClick={() => this.handleAddSection("image")}
            >
              Add image
            </button>
          </p>
          <p className="control">
            <button
              type="button"
              className="button is-danger"
              onClick={() => this.handleAddSection("embed")}
            >
              Add embedded media
            </button>
          </p>
        </div>
        <div className="field">
          <label className="label">tags</label>
          <div className="control">
            <Select isMulti options={tags} onChange={value => this.handleMainTagChange(value)} />
          </div>
        </div>
        {this.state.subTagsOptions.length > 0 && (
          <div className="field">
            <label className="label">sub - tags</label>
            <div className="control">
              <Select
                isMulti
                options={this.state.subTagsOptions}
                onChange={value => this.handleSubTagChange(value)}
              />
            </div>
          </div>
        )}
        {this.state.subSubTagsOptions.length > 0 && (
          <div className="field">
            <label className="label">sub - sub - tags</label>
            <div className="control">
              <Select
                isMulti
                options={this.state.subSubTagsOptions}
                onChange={value => this.handleSubSubTagChange(value)}
              />
            </div>
          </div>
        )}
        <p className="control">
          <button
            type="submit"
            className={`button is-warning ${this.state.submitting && "is-loading"}`}
            disabled={!isValid}
          >
            Ανέβαστο
          </button>
        </p>
      </form>
    );
  }
}

export default PostForm;
