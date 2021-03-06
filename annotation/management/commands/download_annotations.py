import os
import json
from django.core.management.base import BaseCommand
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from annotation.models import Exercise, Sound, DataSet


class Command(BaseCommand):
    """
    Download annotations in the CAMUT file system. It will download one annotations file per sound in the CAMUT format
    into the original location of the sound file
    """

    @staticmethod
    def add_arguments(parser):
        parser.add_argument('dataset', type=str, default=False, help='dataset name')

    def handle(self, *args, **options):
        data_set_name = options['dataset']

        try:
            DataSet.objects.get(name=data_set_name)
        except ObjectDoesNotExist:
            print("this data set does not exists in the database")
            return 0

        for sound in Sound.objects.filter(exercise__in=Exercise.objects.filter(data_set__name=data_set_name)).\
                filter(is_discarded=False):
            print("SOUND: %s %s" % (sound.id, sound.filename))
            # only download annotations for sound that are not the reference of the exercise
            if sound != sound.exercise.reference_sound:
                try:
                    export_directory = [settings.EXPORT_PATH]
                    if sound.exercise.data_set.name not in sound.original_filename:
                        export_directory.append(sound.exercise.data_set.name)
                    export_path_list = export_directory + sound.original_filename.split(os.sep)[2:]
                    export_path = "/".join(export_path_list)
                    # change file extension to .json
                    annotation_file_path = os.path.splitext(export_path)[0] + '.json'
                    annotations = sound.get_annotations_as_dict()
                    os.makedirs(os.path.dirname(annotation_file_path), exist_ok=True)
                    with open(annotation_file_path, 'w') as outfile:
                        json.dump(annotations, outfile)
                except Exception as e:
                    print(e)
