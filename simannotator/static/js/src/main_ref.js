'use strict';

/*
 * Purpose:
 *   Combines all the components of the interface. Creates each component, gets task
 *   data, updates components. When the user submits their work this class gets the workers
 *   annotations and other data and submits to the backend
 * Dependencies:
 *   AnnotationStages (src/annotation_stages.js), PlayBar & WorkflowBtns (src/components.js), 
 *   HiddenImg (src/hidden_image.js), colormap (colormap/colormap.min.js) , Wavesurfer (lib/wavesurfer.min.js)
 * Globals variable from other files:
 *   colormap.min.js:
 *       magma // color scheme array that maps 0 - 255 to rgb values
 *    
 */
function UrbanEars() {
    this.wavesurfer;
    this.playBar;
    this.stages;
    this.workflowBtns;
    this.currentTask;
    this.taskStartTime;
    this.hiddenImage;
    this.soundReady = false;
    this.refReady = false;
    // Boolean, true if currently sending http post request 
    this.sendingResponse = false;

    // Create color map for spectrogram
    var spectrogramColorMap = colormap({
        colormap: magma,
        nshades: 256,
        format: 'rgb',
        alpha: 1
    });

    // Create wavesurfer (audio visualization component)
    var height = 128;
    this.wavesurfer = Object.create(WaveSurfer);
    this.wavesurfer.init({
        container: '.audio_visual',
        waveColor: '#FF00FF',
        progressColor: '#FF00FF',
        // For the spectrogram the height is half the number of fftSamples
        fftSamples: height * 2,
        height: height,
        colorMap: spectrogramColorMap
    });

    // Create labels (labels that appear above each region)
    var labels = Object.create(WaveSurfer.Labels);
    labels.init({
        wavesurfer: this.wavesurfer,
        container: '.labels'
    });

    // Create hiddenImage, an image that is slowly revealed to a user as they annotate 
    // (only for this.currentTask.feedback === 'hiddenImage')
    this.hiddenImage = new HiddenImg('.hidden_img', 100);
    this.hiddenImage.create();

    // Create the play button and time that appear below the wavesurfer
    this.playBar = new PlayBar(this.wavesurfer, '.play_bar');
    this.playBar.create();
    
    // Create the annotation stages that appear below the wavesurfer. The stages contain tags 
    // the users use to label a region in the audio clip
    this.stages = new AnnotationStages(this.wavesurfer, this.hiddenImage, null, true);
    this.stages.create();

    // Create Workflow btns (submit and exit)
    this.workflowBtns = new WorkflowBtns();
    this.workflowBtns.create();

    this.addEvents();
}

UrbanEars.prototype = {
    addWaveSurferEvents: function() {
        var my = this;

        // function that moves the vertical progress bar to the current time in the audio clip
        var updateProgressBar = function () {
            var progress = my.wavesurfer.getCurrentTime() / my.wavesurfer.getDuration();
            my.wavesurfer.seekTo(progress);
        };

        this.wavesurfer.on('pause', updateProgressBar);
        this.wavesurfer.on('finish', updateProgressBar);    

        // When a new sound file is loaded into the wavesurfer update the  play bar, update the 
        // annotation stages back to stage 1, update when the user started the task, update the workflow buttons.
        // Also if the user is suppose to get hidden image feedback, append that component to the page
        this.wavesurfer.on('ready', function () {
           my.loadSegments();
        });

    },
 
    loadSegments: function(){
      var my = this;
      my.playBar.update();
      my.currentTask.segments.forEach(function(section){
      var values = {
        start: section.start,
        end: section.end,
        id: section.id,
        annotation: section.annotation,
        similarity: section.similarity
      }; 
      var region = my.wavesurfer.addRegion(values);
      my.stages.createRegionSwitchToStageThree(region);
    });
    my.stages.updateStage(1);
    my.updateTaskTime();
    my.workflowBtns.update();
    },

    updateTaskTime: function() {
        this.taskStartTime = new Date().getTime();
    },

    // Event Handler, if the user clicks submit annotations call submitAnnotations
    addWorkflowBtnEvents: function() {
        $(this.workflowBtns).on('submit-annotations', this.submitAnnotations.bind(this));
    },

    addEvents: function() {
        this.addWaveSurferEvents();
        this.addWorkflowBtnEvents();
    },

    // Update the task specific data of the interfaces components
    update: function() {
        var my = this;
        var mainUpdate = function(annotationSolutions) {

            // Update the different tags the user can use to annotate, also update the solutions to the
            // annotation task if the user is suppose to recieve feedback
            var similaritySegment= my.currentTask.similaritySegment;
            var annotationType = my.currentTask.annotationType;
            var recordingIndex = my.currentTask.recordingIndex || 1;
            var numRecordings = my.currentTask.numRecordings || 1;
            var alwaysShowTags = my.currentTask.alwaysShowTags;
            my.stages.reset(
                [],
                [],
                annotationType,
                annotationSolutions,
                alwaysShowTags
            );

            // Update clip & time tracker of Header
            $('#recording-index').html(recordingIndex);
            $('#time-remaining').html((numRecordings - recordingIndex) * 1.5 + 5); // e.g. each clip should take 1.5 minutes, and all post-annotation tasks 5 mins.

            // Update the visualization type and the feedback type and load in the new audio clip
            my.wavesurfer.params.visualization = my.currentTask.visualization; // invisible, spectrogram, waveform
            my.wavesurfer.params.feedback = my.currentTask.feedback; // hiddenImage, silent, notify, none 
            my.wavesurfer.load(my.currentTask.url);
        };

        // Just update task specific data right away
        mainUpdate({});
    },

    // Update the interface with the next task's data
    loadNextTask: function() {
        var my = this;
        $.getJSON(dataUrl)
        .done(function(data) {
            my.currentTask = data.task;
            my.update();
        });
    },

    // Collect data about users annotations and submit it to the backend
    submitAnnotations: function() {
        // Check if all the regions have been labeled before submitting
        if (this.stages.annotationDataValidationCheck()) {
            if (this.sendingResponse) {
                // If it is already sending a post with the data, do nothing
                return;
            }
            this.sendingResponse = true;
            // Get data about the annotations the user has created
            var content = {
                annotations: this.stages.getAnnotations(),
            };

            if (this.stages.aboveThreshold()) {
                // If the user is suppose to recieve feedback and got enough of the annotations correct
                // display the city the clip was recorded for 2 seconds and then submit their work
                var my = this;
                this.stages.displaySolution();
                setTimeout(function() {
                    my.post(content);
                }, 2000);
            } else {
                this.post(content);
            }
        }
    },

    // Make POST request, passing back the content data. On success load in the next task
    post: function (content) {
        console.log("This post will fail since this is a frontend demo.");
        console.log("Here is the data about the annotation task");
        console.log(content);
        var my = this;
        $.ajax({
            type: 'POST',
            url: dataUrl,
            data: JSON.stringify(content),
            contentType: "application/json; charset=utf-8",
        })
        .done(function(data) {
            if (data.status == "success" && data.next != null) {
              window.location = data.next;
            }
        })
        .fail(function() {
            alert('Error: Unable to Submit Annotations');
        })
        .always(function() {
            // No longer sending response
            my.sendingResponse = false;
        });
    }

};

function main() {
    // Create all the components
    var urbanEars = new UrbanEars();
    // Load the first audio annotation task
    urbanEars.loadNextTask();
}
main();